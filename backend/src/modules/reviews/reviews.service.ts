import { prisma } from '../../lib/prisma';
import { codedError } from '../../lib/errors';

export class ReviewsService {
  async create(gymId: string, userId: string, input: { rating: number; title?: string; comment?: string }) {
    const gym = await prisma.gym.findUnique({ where: { id: gymId }, select: { id: true, status: true } });
    if (!gym || gym.status !== 'APPROVED') throw codedError('Gym not found', { statusCode: 404, code: 'GYM_NOT_FOUND' });
    try {
      return await prisma.review.create({
        data: { gymId, userId, rating: input.rating, title: input.title, comment: input.comment },
        include: { user: { select: { id: true, name: true } } },
      });
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'P2002') throw codedError('You have already reviewed this gym', { statusCode: 409, code: 'REVIEW_EXISTS' });
      throw e;
    }
  }

  async list(gymId: string, page = 1, pageSize = 20, includeHidden = false) {
    const where = { gymId, ...(includeHidden ? {} : { isHidden: false }) };
    const [total, reviews, agg] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({ where, include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.review.aggregate({ where: { gymId, isHidden: false }, _avg: { rating: true }, _count: { _all: true } }),
    ]);
    return {
      reviews,
      averageRating: agg._avg.rating != null ? Math.round(agg._avg.rating * 10) / 10 : null,
      reviewCount: agg._count._all,
      meta: { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)), hasMore: page * pageSize < total },
    };
  }

  async update(id: string, userId: string, input: { rating?: number; title?: string | null; comment?: string | null }) {
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) throw codedError('Review not found', { statusCode: 404, code: 'REVIEW_NOT_FOUND' });
    if (existing.userId !== userId) throw codedError('Not authorized', { statusCode: 403, code: 'FORBIDDEN' });
    return prisma.review.update({ where: { id }, data: { ...(input.rating != null ? { rating: input.rating } : {}), ...(input.title !== undefined ? { title: input.title } : {}), ...(input.comment !== undefined ? { comment: input.comment } : {}) } });
  }

  async remove(id: string, userId: string, isAdmin = false) {
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) throw codedError('Review not found', { statusCode: 404, code: 'REVIEW_NOT_FOUND' });
    if (!isAdmin && existing.userId !== userId) throw codedError('Not authorized', { statusCode: 403, code: 'FORBIDDEN' });
    await prisma.review.delete({ where: { id } });
    return { deleted: true };
  }

  async setHidden(id: string, hidden: boolean) {
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) throw codedError('Review not found', { statusCode: 404, code: 'REVIEW_NOT_FOUND' });
    return prisma.review.update({ where: { id }, data: { isHidden: hidden } });
  }
}
