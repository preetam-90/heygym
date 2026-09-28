import { prisma } from '../../lib/prisma';
import { writeAudit } from '../../lib/audit';
import { UpdateGymStatusInput } from './admin.schema';

export interface GymStatusAuditMeta {
  actorId?: string | null;
  ip?: string | null;
}

export class AdminService {
  async getUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return users;
  }

  async getGyms() {
    const gyms = await prisma.gym.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        membershipPlans: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return gyms;
  }

  async updateGymStatus(gymId: string, input: UpdateGymStatusInput, meta?: GymStatusAuditMeta) {
    return prisma.$transaction(async (tx) => {
      const gym = await tx.gym.update({
        where: { id: gymId },
        data: {
          status: input.status,
          rejectionReason: input.status === 'REJECTED' ? (input.reason ?? null) : null,
          verifiedAt: input.status === 'APPROVED' ? new Date() : undefined,
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
      });
      await writeAudit(
        {
          actorId: meta?.actorId ?? null,
          action: input.status === 'APPROVED' ? 'gym.approve' : 'gym.reject',
          targetType: 'gym',
          targetId: gymId,
          reason: input.reason ?? null,
          ip: meta?.ip ?? null,
        },
        tx,
      );
      return gym;
    });
  }

  async getStats() {
    const [totalUsers, totalGyms, pendingGyms, approvedGyms, rejectedGyms] = await Promise.all([
      prisma.user.count(),
      prisma.gym.count(),
      prisma.gym.count({ where: { status: 'PENDING' } }),
      prisma.gym.count({ where: { status: 'APPROVED' } }),
      prisma.gym.count({ where: { status: 'REJECTED' } }),
    ]);

    return { totalUsers, totalGyms, pendingGyms, approvedGyms, rejectedGyms };
  }
}