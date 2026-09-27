import { prisma } from '../../lib/prisma';
import argon2 from 'argon2';
import { UpdateProfileInput } from './users.schema';

export class UsersService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const data: any = {};
    if (input.name) data.name = input.name;
    if (input.email) {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing && existing.id !== userId) {
        throw new Error('Email already in use');
      }
      data.email = input.email;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const isValid = await argon2.verify(user.passwordHash, currentPassword);
    if (!isValid) throw new Error('Current password is incorrect');

    const passwordHash = await argon2.hash(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}