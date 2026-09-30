import { prisma } from '../../lib/prisma';
import { writeAudit } from '../../lib/audit';
import { codedError } from '../../lib/errors';
import { UpdateGymStatusInput } from './admin.schema';
import { decimalToNumber } from '../../lib/money';

export interface GymStatusAuditMeta {
  actorId?: string | null;
  ip?: string | null;
}

export class AdminService {
  async getUsers(page = 1, pageSize = 20, search?: string) {
    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] }
      : {};
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true, phone: true, role: true, status: true, isActive: true, createdAt: true, updatedAt: true },
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { users, meta: { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) } };
  }

  async getGyms(page = 1, pageSize = 20, status?: string) {
    const where = status ? { status: status as never } : {};
    const [total, gyms] = await Promise.all([
      prisma.gym.count({ where }),
      prisma.gym.findMany({
        where,
        include: { owner: { select: { id: true, name: true, email: true } }, membershipPlans: true, gymFacilities: { include: { facility: true } }, photos: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const serialized = gyms.map((g) => {
      const detailed = g.gymFacilities.map((gf) => gf.facility);
      return {
        ...g,
        membershipPlans: g.membershipPlans.map((p) => {
          const price = decimalToNumber(p.price as never) ?? 0;
          const dd = (p as { durationDays: number }).durationDays;
          return { ...p, price, durationDays: dd, duration: dd };
        }),
        facilities: detailed.map((f) => f.name),
        facilitiesDetailed: detailed,
        images: g.photos,
      };
    });
    return { gyms: serialized, meta: { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) } };
  }

  async getPendingGyms(page = 1, pageSize = 20) {
    return this.getGyms(page, pageSize, 'PENDING_APPROVAL');
  }

  async getGymById(id: string) {
    const gym = await prisma.gym.findUnique({
      where: { id },
      include: { owner: { select: { id: true, name: true, email: true } }, membershipPlans: true, gymFacilities: { include: { facility: true } }, photos: true, hours: true, reviews: { take: 5, orderBy: { createdAt: 'desc' } } },
    });
    if (!gym) throw codedError('Gym not found', { statusCode: 404, code: 'GYM_NOT_FOUND' });
    const detailed = gym.gymFacilities.map((gf) => gf.facility);
    return {
      ...gym,
      membershipPlans: gym.membershipPlans.map((p) => {
        const price = decimalToNumber(p.price as never) ?? 0;
        const dd = (p as { durationDays: number }).durationDays;
        return { ...p, price, durationDays: dd, duration: dd };
      }),
      facilities: detailed.map((f) => f.name),
      facilitiesDetailed: detailed,
      images: gym.photos,
    };
  }

  private async setStatus(gymId: string, status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SUSPENDED', input: { reason?: string }, meta?: GymStatusAuditMeta) {
    return prisma.$transaction(async (tx) => {
      const gym = await tx.gym.update({
        where: { id: gymId },
        data: {
          status,
          rejectionReason: status === 'DRAFT' ? (input.reason ?? null) : null,
          verifiedAt: status === 'APPROVED' ? new Date() : undefined,
        },
        include: { owner: { select: { id: true, name: true, email: true } } },
      });
      const actionMap: Record<string, string> = { APPROVED: 'gym.approve', DRAFT: 'gym.reject', SUSPENDED: 'gym.suspend', PENDING_APPROVAL: 'gym.restore' };
      await writeAudit(
        { actorId: meta?.actorId ?? null, action: actionMap[status] ?? `gym.${status.toLowerCase()}`, targetType: 'gym', targetId: gymId, reason: input.reason ?? null, ip: meta?.ip ?? null },
        tx as never,
      );
      // Notify owner
      await tx.notification.create({
        data: {
          userId: gym.ownerId,
          type: `gym.${status.toLowerCase()}`,
          title: status === 'APPROVED' ? 'Gym approved' : status === 'SUSPENDED' ? 'Gym suspended' : status === 'DRAFT' ? 'Gym needs changes' : 'Gym status updated',
          message: status === 'DRAFT' && input.reason ? `Changes requested: ${input.reason}` : `Your gym ${gym.name} is now ${status}`,
          data: { gymId },
        },
      }).catch(() => null);
      return gym;
    });
  }

  async approveGym(gymId: string, meta?: GymStatusAuditMeta) {
    return this.setStatus(gymId, 'APPROVED', {}, meta);
  }

  async rejectGym(gymId: string, reason: string, meta?: GymStatusAuditMeta) {
    if (!reason?.trim()) throw codedError('Rejection reason is required', { statusCode: 400, code: 'VALIDATION_ERROR' });
    // Rejected gyms return to DRAFT with reason in audit history
    return this.setStatus(gymId, 'DRAFT', { reason } as UpdateGymStatusInput, meta);
  }

  async suspendGym(gymId: string, reason: string | undefined, meta?: GymStatusAuditMeta) {
    return this.setStatus(gymId, 'SUSPENDED', { reason } as UpdateGymStatusInput, meta);
  }

  async restoreGym(gymId: string, meta?: GymStatusAuditMeta) {
    // Restore sends back to PENDING_APPROVAL for re-review (or DRAFT if never approved)
    const gym = await prisma.gym.findUnique({ where: { id: gymId }, select: { verifiedAt: true } });
    const target = gym?.verifiedAt ? 'APPROVED' as const : 'PENDING_APPROVAL' as const;
    if (target === 'APPROVED') return this.setStatus(gymId, 'APPROVED', {}, meta);
    return this.setStatus(gymId, 'PENDING_APPROVAL', {}, meta);
  }

  // Legacy single-endpoint compat
  async updateGymStatus(gymId: string, input: UpdateGymStatusInput, meta?: GymStatusAuditMeta) {
    if (input.status === 'APPROVED') return this.approveGym(gymId, meta);
    if (input.status === 'REJECTED') return this.rejectGym(gymId, input.reason ?? 'Rejected', meta);
    if (input.status === 'SUSPENDED') return this.suspendGym(gymId, input.reason, meta);
    if (input.status === 'DRAFT') return this.rejectGym(gymId, input.reason ?? 'Returned to draft', meta);
    return this.setStatus(gymId, input.status as 'PENDING_APPROVAL', input, meta);
  }

  async getStats() {
    const [totalUsers, totalGyms, pendingGyms, approvedGyms, draftGyms, suspendedGyms, totalEnquiries, totalReviews, totalFavorites] = await Promise.all([
      prisma.user.count(),
      prisma.gym.count(),
      prisma.gym.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.gym.count({ where: { status: 'APPROVED' } }),
      prisma.gym.count({ where: { status: 'DRAFT' } }),
      prisma.gym.count({ where: { status: 'SUSPENDED' } }),
      prisma.enquiry.count(),
      prisma.review.count(),
      prisma.favorite.count(),
    ]);
    return { totalUsers, totalGyms, pendingGyms, approvedGyms, rejectedGyms: draftGyms, draftGyms, suspendedGyms, totalEnquiries, totalReviews, totalFavorites };
  }

  async listEnquiries(page = 1, pageSize = 20) {
    const [total, enquiries] = await Promise.all([
      prisma.enquiry.count(),
      prisma.enquiry.findMany({ include: { gym: { select: { id: true, name: true } }, user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    ]);
    return { enquiries, meta: { total, page, pageSize } };
  }
}
