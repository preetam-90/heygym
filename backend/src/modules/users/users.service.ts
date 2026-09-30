import { prisma } from '../../lib/prisma';
import { storage } from '../../lib/storage';
import { codedError } from '../../lib/errors';
import argon2 from 'argon2';
import { UpdateProfileInput } from './users.schema';

const publicSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatarUrl: true,
  role: true,
  status: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const ALLOWED_PHOTO_MIME: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
};

export class UsersService {
  async getProfile(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, select: publicSelect });
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const data: Record<string, unknown> = {};
    if (input.name) data.name = input.name;
    if (input.email) {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing && existing.id !== userId) throw new Error('Email already in use');
      data.email = input.email;
    }
    if (input.phone !== undefined) {
      if (input.phone) {
        const existing = await prisma.user.findUnique({ where: { phone: input.phone } }).catch(() => null);
        if (existing && existing.id !== userId) throw new Error('Phone already in use');
        data.phone = input.phone;
      } else {
        data.phone = null;
      }
    }
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl;

    return prisma.user.update({ where: { id: userId }, data, select: publicSelect });
  }

  async setAvatar(userId: string, buffer: Buffer, mime: string, filename: string) {
    const allowedExts = ALLOWED_PHOTO_MIME[mime];
    if (!allowedExts) throw codedError('Only JPG, PNG, and WebP images are allowed', { statusCode: 400, code: 'VALIDATION_ERROR' });
    if (buffer.length > MAX_AVATAR_BYTES) throw codedError('Image must be 5 MB or smaller', { statusCode: 400, code: 'VALIDATION_ERROR' });
    const ext = (filename.split('.').pop() ?? '').toLowerCase();
    if (!allowedExts.includes(ext)) throw codedError('File extension does not match image type', { statusCode: 400, code: 'VALIDATION_ERROR' });
    const { url } = await storage.upload(buffer, { mime, ext });
    try {
      return await prisma.user.update({ where: { id: userId }, data: { avatarUrl: url }, select: publicSelect });
    } catch (err) {
      await storage.delete(url).catch(() => undefined);
      throw err;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    const isValid = await argon2.verify(user.passwordHash, currentPassword);
    if (!isValid) throw new Error('Current password is incorrect');
    const passwordHash = await argon2.hash(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }
}
