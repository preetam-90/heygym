import { prisma } from '../../lib/prisma';
import { codedError } from '../../lib/errors';

export class FavoritesService {
  async add(userId: string, gymId: string) {
    const gym = await prisma.gym.findUnique({ where: { id: gymId }, select: { id: true, status: true } });
    if (!gym || gym.status !== 'APPROVED') throw codedError('Gym not found', { statusCode: 404, code: 'GYM_NOT_FOUND' });
    try {
      const fav = await prisma.favorite.create({ data: { userId, gymId }, include: { gym: { include: { membershipPlans: true, photos: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] }, gymFacilities: { include: { facility: true } } } } } });
      return fav;
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'P2002') throw codedError('Already favorited', { statusCode: 409, code: 'FAVORITE_EXISTS' });
      throw e;
    }
  }

  async remove(userId: string, gymId: string) {
    await prisma.favorite.deleteMany({ where: { userId, gymId } });
    return { deleted: true };
  }

  async list(userId: string, page = 1, pageSize = 20) {
    const [total, items] = await Promise.all([
      prisma.favorite.count({ where: { userId } }),
      prisma.favorite.findMany({
        where: { userId },
        include: { gym: { include: { membershipPlans: { where: { isActive: true } }, photos: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] }, gymFacilities: { include: { facility: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { favorites: items, meta: { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)), hasMore: page * pageSize < total } };
  }
}
