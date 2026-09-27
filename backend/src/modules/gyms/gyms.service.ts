import { prisma } from '../../lib/prisma';
import { CreateGymInput, UpdateGymInput, CreateMembershipPlanInput, UpdateMembershipPlanInput } from './gyms.schema';

export class GymsService {
  async createGym(ownerId: string, input: CreateGymInput) {
    const gym = await prisma.gym.create({
      data: {
        ...input,
        ownerId,
      },
    });
    return gym;
  }

  async getGymById(id: string) {
    const gym = await prisma.gym.findUnique({
      where: { id },
      include: {
        membershipPlans: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    return gym;
  }

  async getApprovedGyms() {
    const gyms = await prisma.gym.findMany({
      where: { status: 'APPROVED' },
      include: {
        membershipPlans: true,
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
      include: { membershipPlans: true },
      orderBy: { createdAt: 'desc' },
    });
    return gyms;
  }

  async updateGym(gymId: string, ownerId: string, input: UpdateGymInput) {
    const gym = await prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) throw new Error('Gym not found');
    if (gym.ownerId !== ownerId) throw new Error('Not authorized to update this gym');

    const updated = await prisma.gym.update({
      where: { id: gymId },
      data: input,
    });
    return updated;
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