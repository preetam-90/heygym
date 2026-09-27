import { prisma } from '../../lib/prisma';
import { UpdateGymStatusInput } from './admin.schema';

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

  async updateGymStatus(gymId: string, input: UpdateGymStatusInput) {
    const gym = await prisma.gym.update({
      where: { id: gymId },
      data: { status: input.status },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });
    return gym;
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