import { prisma } from '../../lib/prisma';
import { storage } from '../../lib/storage';
import { CreateGymInput, UpdateGymInput, CreateMembershipPlanInput, UpdateMembershipPlanInput } from './gyms.schema';

export const MAX_PHOTOS_PER_GYM = 10;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const ALLOWED_PHOTO_MIME: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
};

export interface CodedErrorOptions {
  statusCode: number;
  code: string;
}

export function codedError(message: string, opts: CodedErrorOptions): Error & CodedErrorOptions {
  return Object.assign(new Error(message), opts);
}

export function notFound(message = 'Gym not found'): Error & CodedErrorOptions {
  return codedError(message, { statusCode: 404, code: 'NOT_FOUND' });
}

const imagesInclude = {
  orderBy: [{ isPrimary: 'desc' as const }, { createdAt: 'desc' as const }],
};

export class GymsService {
  /** Load a gym only when `ownerId` owns it; uniform NOT_FOUND otherwise (no existence leak). */
  private async requireOwnedGym(gymId: string, ownerId: string) {
    const gym = await prisma.gym.findUnique({
      where: { id: gymId },
      include: { images: imagesInclude },
    });
    if (!gym || gym.ownerId !== ownerId) throw notFound();
    return gym;
  }

  private async syncImageUrl(gymId: string): Promise<string | null> {
    const primary =
      (await prisma.gymImage.findFirst({ where: { gymId, isPrimary: true }, orderBy: { createdAt: 'desc' } })) ??
      (await prisma.gymImage.findFirst({ where: { gymId }, orderBy: { createdAt: 'desc' } }));
    const imageUrl = primary?.url ?? null;
    await prisma.gym.update({ where: { id: gymId }, data: { imageUrl } });
    return imageUrl;
  }

  async createGym(ownerId: string, input: CreateGymInput) {
    const gym = await prisma.gym.create({
      data: {
        ...input,
        ownerId,
      },
      include: { images: imagesInclude },
    });
    return gym;
  }

  async getGymById(id: string, viewer?: { id: string; role: string } | null) {
    const gym = await prisma.gym.findUnique({
      where: { id },
      include: {
        membershipPlans: true,
        images: imagesInclude,
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    if (!gym) return null;
    if (gym.status !== 'APPROVED') {
      const isOwner = !!viewer && viewer.id === gym.ownerId;
      const isAdmin = !!viewer && viewer.role === 'ADMIN';
      if (!isOwner && !isAdmin) return null;
    }
    return gym;
  }

  async getApprovedGyms() {
    const gyms = await prisma.gym.findMany({
      where: { status: 'APPROVED' },
      include: {
        membershipPlans: true,
        images: imagesInclude,
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return gyms;
  }

  async getAllGyms() {
    const gyms = await prisma.gym.findMany({
      include: {
        membershipPlans: true,
        images: imagesInclude,
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return gyms;
  }

  async getGymsByOwner(ownerId: string) {
    const gyms = await prisma.gym.findMany({
      where: { ownerId },
      include: { membershipPlans: true, images: imagesInclude },
      orderBy: { createdAt: 'desc' },
    });
    return gyms;
  }

  async updateGym(gymId: string, ownerId: string, input: UpdateGymInput) {
    await this.requireOwnedGym(gymId, ownerId);

    const updated = await prisma.gym.update({
      where: { id: gymId },
      data: input,
      include: { images: imagesInclude },
    });
    return updated;
  }

  async submitGym(gymId: string, ownerId: string) {
    const gym = await this.requireOwnedGym(gymId, ownerId);
    if (gym.status === 'APPROVED' || gym.status === 'SUSPENDED') {
      throw codedError('Only draft or rejected gyms can be submitted', { statusCode: 403, code: 'FORBIDDEN' });
    }
    if (gym.status === 'UNDER_REVIEW') return gym;
    const updated = await prisma.gym.update({
      where: { id: gymId },
      data: { status: 'UNDER_REVIEW', rejectionReason: null },
      include: { images: imagesInclude },
    });
    return updated;
  }

  async uploadPhoto(
    gymId: string,
    ownerId: string,
    buffer: Buffer,
    mime: string,
    filename: string,
  ) {
    await this.requireOwnedGym(gymId, ownerId);

    const allowedExts = ALLOWED_PHOTO_MIME[mime];
    if (!allowedExts) {
      throw codedError('Only JPG, PNG, and WebP images are allowed', { statusCode: 400, code: 'VALIDATION_ERROR' });
    }
    if (buffer.length > MAX_PHOTO_BYTES) {
      throw codedError('Image must be 5 MB or smaller', { statusCode: 400, code: 'VALIDATION_ERROR' });
    }
    const ext = (filename.split('.').pop() ?? '').toLowerCase();
    if (!allowedExts.includes(ext)) {
      throw codedError('File extension does not match image type', { statusCode: 400, code: 'VALIDATION_ERROR' });
    }

    const count = await prisma.gymImage.count({ where: { gymId } });
    if (count >= MAX_PHOTOS_PER_GYM) {
      throw codedError('A gym can have at most 10 photos', { statusCode: 400, code: 'VALIDATION_ERROR' });
    }

    const { url } = await storage.upload(buffer, { mime, ext });
    try {
      const image = await prisma.$transaction(async (tx) => {
        const created = await tx.gymImage.create({
          data: { gymId, url, isPrimary: count === 0 },
        });
        const imageUrl = created.isPrimary
          ? url
          : ((await tx.gym.findUnique({ where: { id: gymId }, select: { imageUrl: true } }))?.imageUrl ?? url);
        await tx.gym.update({ where: { id: gymId }, data: { imageUrl } });
        return created;
      });
      return image;
    } catch (err) {
      await storage.delete(url).catch(() => undefined);
      throw err;
    }
  }

  async deletePhoto(gymId: string, ownerId: string, photoId: string) {
    await this.requireOwnedGym(gymId, ownerId);
    const image = await prisma.gymImage.findFirst({ where: { id: photoId, gymId } });
    if (!image) throw notFound('Photo not found');

    await prisma.gymImage.delete({ where: { id: photoId } });
    await storage.delete(image.url).catch(() => undefined);
    await this.syncImageUrl(gymId);
    return { deleted: true };
  }

  async setPrimaryPhoto(gymId: string, ownerId: string, photoId: string) {
    await this.requireOwnedGym(gymId, ownerId);
    const image = await prisma.gymImage.findFirst({ where: { id: photoId, gymId } });
    if (!image) throw notFound('Photo not found');

    await prisma.$transaction(async (tx) => {
      await tx.gymImage.updateMany({ where: { gymId }, data: { isPrimary: false } });
      await tx.gymImage.update({ where: { id: photoId }, data: { isPrimary: true } });
      await tx.gym.update({ where: { id: gymId }, data: { imageUrl: image.url } });
    });
    return prisma.gymImage.findUnique({ where: { id: photoId } });
  }

  async updateGymStatus(gymId: string, status: 'APPROVED' | 'REJECTED') {
    const gym = await prisma.gym.update({
      where: { id: gymId },
      data: { status },
    });
    return gym;
  }

  async createMembershipPlan(gymId: string, ownerId: string, input: CreateMembershipPlanInput) {
    const gym = await prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) throw new Error('Gym not found');
    if (gym.ownerId !== ownerId) throw new Error('Not authorized to add plans to this gym');

    const plan = await prisma.membershipPlan.create({
      data: { ...input, gymId },
    });
    return plan;
  }

  async getMembershipPlans(gymId: string) {
    const plans = await prisma.membershipPlan.findMany({
      where: { gymId },
      orderBy: { createdAt: 'desc' },
    });
    return plans;
  }

  async updateMembershipPlan(planId: string, gymId: string, ownerId: string, input: UpdateMembershipPlanInput) {
    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');
    if (plan.gymId !== gymId) throw new Error('Plan does not belong to this gym');

    const gym = await prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym || gym.ownerId !== ownerId) throw new Error('Not authorized');

    const updated = await prisma.membershipPlan.update({
      where: { id: planId },
      data: input,
    });
    return updated;
  }
}
