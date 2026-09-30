import { prisma } from '../../lib/prisma';
import { codedError } from '../../lib/errors';
import { writeAudit } from '../../lib/audit';

export class EnquiriesService {
  async createEnquiry(gymId: string, userId: string, message: string) {
    const gym = await prisma.gym.findUnique({ where: { id: gymId }, select: { id: true, status: true, ownerId: true } });
    if (!gym || gym.status !== 'APPROVED') throw codedError('Gym not found', { statusCode: 404, code: 'GYM_NOT_FOUND' });
    const enquiry = await prisma.enquiry.create({ data: { gymId, userId, message, status: 'NEW' }, include: { gym: { select: { id: true, name: true } }, user: { select: { id: true, name: true } } } });
    // Notify owner in-app
    await prisma.notification.create({
      data: {
        userId: gym.ownerId,
        type: 'enquiry.new',
        title: 'New enquiry',
        message: `New enquiry for ${enquiry.gym.name}`,
        data: { enquiryId: enquiry.id, gymId },
      },
    }).catch(() => null);
    return enquiry;
  }

  async listOwnerEnquiries(ownerId: string, opts: { page?: number; pageSize?: number; status?: string; gymId?: string } = {}) {
    const page = opts.page ?? 1;
    const pageSize = Math.min(opts.pageSize ?? 20, 100);
    const owned = await prisma.gym.findMany({ where: { ownerId }, select: { id: true } });
    const gymIds = owned.map((g) => g.id);
    if (gymIds.length === 0) return { enquiries: [], meta: { total: 0, page, pageSize, totalPages: 1, hasMore: false } };
    const where = {
      gymId: { in: [...(opts.gymId ? [opts.gymId].filter((id) => gymIds.includes(id)) : gymIds)] },
      ...(opts.status ? { status: opts.status as never } : {}),
    };
    const [total, enquiries] = await Promise.all([
      prisma.enquiry.count({ where }),
      prisma.enquiry.findMany({ where, include: { gym: { select: { id: true, name: true } }, user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    ]);
    return { enquiries, meta: { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)), hasMore: page * pageSize < total } };
  }

  async getOwnerEnquiry(id: string, ownerId: string) {
    const enquiry = await prisma.enquiry.findUnique({ where: { id }, include: { gym: { select: { id: true, ownerId: true, name: true } }, user: { select: { id: true, name: true, email: true } } } });
    if (!enquiry || enquiry.gym.ownerId !== ownerId) throw codedError('Enquiry not found', { statusCode: 404, code: 'ENQUIRY_NOT_FOUND' });
    return enquiry;
  }

  async updateOwnerEnquiry(id: string, ownerId: string, input: { status?: 'NEW' | 'READ' | 'RESPONDED' | 'CLOSED'; response?: string | null }) {
    const existing = await this.getOwnerEnquiry(id, ownerId);
    const updated = await prisma.enquiry.update({ where: { id }, data: { ...(input.status ? { status: input.status } : {}), ...(input.response !== undefined ? { response: input.response } : {}) }, include: { gym: { select: { id: true, name: true } }, user: { select: { id: true, name: true } } } });
    if (input.response || input.status === 'RESPONDED') {
      await prisma.notification.create({
        data: {
          userId: existing.userId,
          type: 'enquiry.response',
          title: 'Gym responded',
          message: `${updated.gym.name} responded to your enquiry`,
          data: { enquiryId: id, gymId: updated.gymId },
        },
      }).catch(() => null);
    }
    await writeAudit({ actorId: ownerId, action: 'enquiry.update', targetType: 'enquiry', targetId: id }).catch(() => null);
    return updated;
  }

  async listUserEnquiries(userId: string, page = 1, pageSize = 20) {
    const [total, enquiries] = await Promise.all([
      prisma.enquiry.count({ where: { userId } }),
      prisma.enquiry.findMany({ where: { userId }, include: { gym: { select: { id: true, name: true, slug: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    ]);
    return { enquiries, meta: { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)), hasMore: page * pageSize < total } };
  }
}
