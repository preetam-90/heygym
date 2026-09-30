import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { storage } from '../../lib/storage';
import { uniqueSlug } from '../../lib/slug';
import { decimalToNumber } from '../../lib/money';
import { codedError } from '../../lib/errors';
import {
  CreateGymInput,
  UpdateGymInput,
  CreateMembershipPlanInput,
  UpdateMembershipPlanInput,
  GymsQuery,
} from './gyms.schema';

export const MAX_PHOTOS_PER_GYM = 10;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const ALLOWED_PHOTO_MIME: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
};

export function codedErrorLocal(message: string, opts: { statusCode: number; code: string }) {
  return codedError(message, opts);
}

export function notFound(message = 'Gym not found') {
  return codedError(message, { statusCode: 404, code: 'GYM_NOT_FOUND' });
}

const photosInclude = {
  orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }, { createdAt: 'desc' as const }],
};

const gymDetailInclude = {
  membershipPlans: { where: { isActive: true }, orderBy: { price: 'asc' as const } },
  photos: photosInclude,
  hours: { orderBy: { dayOfWeek: 'asc' as const } },
  gymFacilities: { include: { facility: true } },
  owner: { select: { id: true, name: true } },
} satisfies Prisma.GymInclude;

type DetailGym = Prisma.GymGetPayload<{ include: typeof gymDetailInclude }>;

const DEFAULT_PAGE_SIZE = 12;
const MAX_SEARCH_RESULTS = 500;
const EARTH_RADIUS_KM = 6371;

function minPlanPrice(gym: { membershipPlans: { price: unknown }[] }): number | null {
  const prices = gym.membershipPlans
    .map((p) => decimalToNumber(p.price as never))
    .filter((n): n is number => n != null);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

function boundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.max(0.01, Math.cos(toRadians(lat))));
  return { minLat: lat - latDelta, maxLat: lat + latDelta, minLng: lng - lngDelta, maxLng: lng + lngDelta };
}

async function ratingMap(gymIds: string[]): Promise<Map<string, { avg: number | null; count: number }>> {
  if (gymIds.length === 0) return new Map();
  const groups = await prisma.review.groupBy({
    by: ['gymId'],
    where: { gymId: { in: gymIds }, isHidden: false },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const map = new Map<string, { avg: number | null; count: number }>();
  for (const g of groups) {
    map.set(g.gymId, {
      avg: g._avg.rating != null ? Math.round(g._avg.rating * 10) / 10 : null,
      count: g._count._all,
    });
  }
  for (const id of gymIds) if (!map.has(id)) map.set(id, { avg: null, count: 0 });
  return map;
}

function serializeGym(gym: DetailGym, rating?: { avg: number | null; count: number }, distanceKm?: number) {
  const { gymFacilities, membershipPlans, photos, ...rest } = gym as DetailGym & { gymFacilities: Array<{ facility: { id: string; name: string; slug: string } }> };
  const facilitiesDetailed = (gymFacilities ?? []).map((gf) => gf.facility);
  const facilityNames = facilitiesDetailed.map((f) => (f as { name: string }).name);
  const plans = (membershipPlans ?? []).map((p) => {
    const price = decimalToNumber(p.price as never) ?? 0;
    const dd = (p as { durationDays: number }).durationDays;
    return { ...p, price, durationDays: dd, duration: dd, features: (p as { features?: string[] }).features ?? [], isActive: (p as { isActive?: boolean }).isActive ?? true };
  });
  return {
    ...rest,
    price: undefined,
    // Canonical structured facilities + backward-compat string names for old web clients
    facilities: facilityNames,
    facilitiesDetailed,
    // Canonical photos + legacy images alias
    photos: photos ?? [],
    images: photos ?? [],
    membershipPlans: plans,
    averageRating: rating?.avg ?? null,
    reviewCount: rating?.count ?? 0,
    ...(distanceKm != null ? { distanceKm } : {}),
  };
}

export class GymsService {
  private async requireOwnedGym(gymId: string, ownerId: string) {
    const gym = await prisma.gym.findUnique({
      where: { id: gymId },
      include: { photos: photosInclude },
    });
    if (!gym || gym.ownerId !== ownerId) throw notFound();
    return gym;
  }

  private async syncImageUrl(gymId: string): Promise<string | null> {
    const primary =
      (await prisma.gymPhoto.findFirst({ where: { gymId, isPrimary: true }, orderBy: { sortOrder: 'asc' } })) ??
      (await prisma.gymPhoto.findFirst({ where: { gymId }, orderBy: { sortOrder: 'asc' } }));
    const imageUrl = primary?.url ?? null;
    await prisma.gym.update({ where: { id: gymId }, data: { imageUrl } });
    return imageUrl;
  }

  private async ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = base.slice(0, 160);
    let attempt = 0;
    while (true) {
      const existing = await prisma.gym.findUnique({ where: { slug }, select: { id: true } });
      if (!existing || existing.id === excludeId) return slug;
      attempt += 1;
      slug = `${base.slice(0, 150)}-${attempt}`.slice(0, 160);
    }
  }

  async createGym(ownerId: string, input: CreateGymInput) {
    const { ...data } = input;
    const baseSlug = uniqueSlug(data.name, `${Date.now()}`);
    const slug = await this.ensureUniqueSlug(baseSlug);
    const gym = await prisma.gym.create({
      data: { ...data, ownerId, slug, status: 'DRAFT' },
      include: gymDetailInclude,
    });
    const ratings = await ratingMap([gym.id]);
    return serializeGym(gym, ratings.get(gym.id));
  }

  async getGymById(id: string, viewer?: { id: string; role: string } | null) {
    const gym = await prisma.gym.findUnique({ where: { id }, include: gymDetailInclude });
    if (!gym) return null;
    if (gym.status !== 'APPROVED') {
      const isOwner = !!viewer && viewer.id === gym.ownerId;
      const isAdmin = !!viewer && viewer.role === 'ADMIN';
      if (!isOwner && !isAdmin) return null;
    }
    const ratings = await ratingMap([gym.id]);
    return serializeGym(gym, ratings.get(gym.id));
  }

  async getGymBySlug(slug: string, viewer?: { id: string; role: string } | null) {
    const gym = await prisma.gym.findUnique({ where: { slug }, include: gymDetailInclude });
    if (!gym) return null;
    if (gym.status !== 'APPROVED') {
      const isOwner = !!viewer && viewer.id === gym.ownerId;
      const isAdmin = !!viewer && viewer.role === 'ADMIN';
      if (!isOwner && !isAdmin) return null;
    }
    const ratings = await ratingMap([gym.id]);
    return serializeGym(gym, ratings.get(gym.id));
  }

  private buildWhere(params: GymsQuery): Prisma.GymWhereInput {
    const and: Prisma.GymWhereInput[] = [];
    const terms = params.q ? params.q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 5) : [];
    for (const term of terms) {
      and.push({
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { city: { contains: term, mode: 'insensitive' } },
          { state: { contains: term, mode: 'insensitive' } },
          { address: { contains: term, mode: 'insensitive' } },
          { services: { has: term } },
        ],
      });
    }
    if (params.city) and.push({ city: { contains: params.city, mode: 'insensitive' } });
    // Facilities: slug match (normalized M2M). All requested facilities must be present.
    for (const fac of params.facilities ?? []) {
      and.push({ gymFacilities: { some: { facility: { slug: fac } } } });
    }
    if (params.minPrice != null || params.maxPrice != null) {
      and.push({
        membershipPlans: {
          some: {
            isActive: true,
            ...(params.minPrice != null ? { price: { gte: params.minPrice } } : {}),
            ...(params.maxPrice != null ? { price: { lte: params.maxPrice } } : {}),
          },
        },
      });
    }
    const usingGeo = params.lat != null && params.lng != null && params.radiusKm != null;
    if (usingGeo) {
      const box = boundingBox(params.lat!, params.lng!, params.radiusKm!);
      and.push({ latitude: { gte: box.minLat, lte: box.maxLat } });
      and.push({ longitude: { gte: box.minLng, lte: box.maxLng } });
    }
    return { status: 'APPROVED', deletedAt: null, ...(and.length > 0 ? { AND: and } : {}) };
  }

  private buildResult<T>(gyms: T[], total: number, page: number, pageSize: number) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return { gyms, meta: { total, page, pageSize, totalPages, hasMore: page < totalPages } };
  }

  async searchGyms(params: GymsQuery) {
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? DEFAULT_PAGE_SIZE, 100);
    const sort = params.sort ?? 'newest';
    const where = this.buildWhere(params);

    const usingGeo = params.lat != null && params.lng != null && params.radiusKm != null;
    const needsMemory = usingGeo || sort === 'price_low' || sort === 'price_high' || sort === 'rating' || params.minRating != null;

    if (!needsMemory) {
      const orderBy: Prisma.GymOrderByWithRelationInput = { createdAt: 'desc' };
      const [total, gyms] = await Promise.all([
        prisma.gym.count({ where }),
        prisma.gym.findMany({ where, include: gymDetailInclude, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
      ]);
      const ratings = await ratingMap(gyms.map((g) => g.id));
      const serialized = gyms.map((g) => serializeGym(g, ratings.get(g.id)));
      return this.buildResult(serialized, total, page, pageSize);
    }

    const working = await prisma.gym.findMany({
      where,
      include: gymDetailInclude,
      orderBy: { createdAt: 'desc' },
      take: MAX_SEARCH_RESULTS,
    });
    const ratings = await ratingMap(working.map((g) => g.id));

    let ordered: Array<DetailGym & { distanceKm?: number }> = working as Array<DetailGym & { distanceKm?: number }>;

    if (usingGeo) {
      ordered = working
        .map((gym) => ({
          gym,
          distance:
            gym.latitude != null && gym.longitude != null
              ? haversineKm(params.lat!, params.lng!, gym.latitude, gym.longitude)
              : null,
        }))
        .filter((e): e is { gym: DetailGym; distance: number } => e.distance != null && e.distance <= params.radiusKm!)
        .sort((a, b) => a.distance - b.distance)
        .map((e) => ({ ...e.gym, distanceKm: Math.round(e.distance * 10) / 10 }));
    }

    if (params.minRating != null) {
      ordered = ordered.filter((g) => (ratings.get(g.id)?.avg ?? 0) >= params.minRating!);
    }

    if (sort === 'price_low' || sort === 'price_high') {
      const dir = sort === 'price_high' ? -1 : 1;
      ordered = [...ordered].sort((a, b) => {
        const ap = minPlanPrice(a);
        const bp = minPlanPrice(b);
        if (ap == null && bp == null) return 0;
        if (ap == null) return 1;
        if (bp == null) return -1;
        return (ap - bp) * dir;
      });
    } else if (sort === 'rating') {
      ordered = [...ordered].sort((a, b) => {
        const ar = ratings.get(a.id);
        const br = ratings.get(b.id);
        if ((br?.avg ?? 0) !== (ar?.avg ?? 0)) return (br?.avg ?? 0) - (ar?.avg ?? 0);
        return (br?.count ?? 0) - (ar?.count ?? 0);
      });
    } else if (sort === 'nearest' && !usingGeo) {
      // nearest without geo falls back to newest
    }

    const total = ordered.length;
    const start = (page - 1) * pageSize;
    const slice = ordered.slice(start, start + pageSize);
    const serialized = slice.map((g) => {
      const { distanceKm, ...rest } = g as DetailGym & { distanceKm?: number };
      return serializeGym(rest as DetailGym, ratings.get(g.id), distanceKm);
    });
    return this.buildResult(serialized, total, page, pageSize);
  }

  async getAllGyms() {
    const gyms = await prisma.gym.findMany({ include: gymDetailInclude, orderBy: { createdAt: 'desc' } });
    const ratings = await ratingMap(gyms.map((g) => g.id));
    return gyms.map((g) => serializeGym(g, ratings.get(g.id)));
  }

  async getGymsByOwner(ownerId: string) {
    const gyms = await prisma.gym.findMany({
      where: { ownerId },
      include: gymDetailInclude,
      orderBy: { createdAt: 'desc' },
    });
    const ratings = await ratingMap(gyms.map((g) => g.id));
    return gyms.map((g) => serializeGym(g, ratings.get(g.id)));
  }

  async updateGym(gymId: string, ownerId: string, input: UpdateGymInput) {
    await this.requireOwnedGym(gymId, ownerId);
    const data: Prisma.GymUpdateInput = { ...input };
    if (input.name) {
      const baseSlug = uniqueSlug(input.name, gymId);
      data.slug = await this.ensureUniqueSlug(baseSlug, gymId);
    }
    const updated = await prisma.gym.update({ where: { id: gymId }, data, include: gymDetailInclude });
    const ratings = await ratingMap([updated.id]);
    return serializeGym(updated, ratings.get(updated.id));
  }

  async deleteGym(gymId: string, ownerId: string) {
    await this.requireOwnedGym(gymId, ownerId);
    await prisma.gym.delete({ where: { id: gymId } });
    return { deleted: true };
  }

  async submitGym(gymId: string, ownerId: string) {
    const gym = await this.requireOwnedGym(gymId, ownerId);
    if (gym.status === 'APPROVED' || gym.status === 'SUSPENDED') {
      throw codedError('Only draft gyms can be submitted', { statusCode: 403, code: 'GYM_ALREADY_SUBMITTED' });
    }
    if (gym.status === 'PENDING_APPROVAL') return this.getGymById(gymId, { id: ownerId, role: 'GYM_OWNER' });
    const updated = await prisma.gym.update({
      where: { id: gymId },
      data: { status: 'PENDING_APPROVAL', rejectionReason: null },
      include: gymDetailInclude,
    });
    const ratings = await ratingMap([updated.id]);
    return serializeGym(updated, ratings.get(updated.id));
  }

  // Facilities (normalized M2M)
  async listFacilities() {
    return prisma.facility.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }

  async setGymFacilities(gymId: string, ownerId: string, facilityIds: string[]) {
    await this.requireOwnedGym(gymId, ownerId);
    const facilities = await prisma.facility.findMany({ where: { id: { in: facilityIds }, isActive: true } });
    if (facilities.length !== facilityIds.length) throw codedError('One or more facilities not found', { statusCode: 404, code: 'FACILITY_NOT_FOUND' });
    await prisma.$transaction(async (tx) => {
      await tx.gymFacility.deleteMany({ where: { gymId } });
      if (facilityIds.length > 0) {
        await tx.gymFacility.createMany({ data: facilityIds.map((fid) => ({ gymId, facilityId: fid })), skipDuplicates: true });
      }
    });
    return this.getGymById(gymId, { id: ownerId, role: 'GYM_OWNER' });
  }

  async addGymFacility(gymId: string, ownerId: string, facilityIdOrSlug: string) {
    await this.requireOwnedGym(gymId, ownerId);
    const facility = await prisma.facility.findFirst({
      where: { OR: [{ id: facilityIdOrSlug }, { slug: facilityIdOrSlug.toLowerCase() }], isActive: true },
    });
    if (!facility) throw codedError('Facility not found', { statusCode: 404, code: 'FACILITY_NOT_FOUND' });
    await prisma.gymFacility.upsert({
      where: { gymId_facilityId: { gymId, facilityId: facility.id } },
      create: { gymId, facilityId: facility.id },
      update: {},
    });
    return facility;
  }

  async removeGymFacility(gymId: string, ownerId: string, facilityId: string) {
    await this.requireOwnedGym(gymId, ownerId);
    // Allow slug or id
    const facility = await prisma.facility.findFirst({ where: { OR: [{ id: facilityId }, { slug: facilityId }] } });
    const fid = facility?.id ?? facilityId;
    await prisma.gymFacility.deleteMany({ where: { gymId, facilityId: fid } });
    return { deleted: true };
  }

  // Hours
  async getHours(gymId: string) {
    return prisma.gymHours.findMany({ where: { gymId }, orderBy: { dayOfWeek: 'asc' } });
  }

  async setHours(gymId: string, ownerId: string, hours: Array<{ dayOfWeek: number; openTime?: string | null; closeTime?: string | null; isClosed?: boolean }>) {
    await this.requireOwnedGym(gymId, ownerId);
    await prisma.$transaction(
      hours.map((h) =>
        prisma.gymHours.upsert({
          where: { gymId_dayOfWeek: { gymId, dayOfWeek: h.dayOfWeek } },
          create: { gymId, dayOfWeek: h.dayOfWeek, openTime: h.openTime ?? null, closeTime: h.closeTime ?? null, isClosed: h.isClosed ?? false },
          update: { openTime: h.openTime ?? null, closeTime: h.closeTime ?? null, isClosed: h.isClosed ?? false },
        }),
      ),
    );
    return this.getHours(gymId);
  }

  // Photos
  async uploadPhoto(gymId: string, ownerId: string, buffer: Buffer, mime: string, filename: string) {
    await this.requireOwnedGym(gymId, ownerId);
    const allowedExts = ALLOWED_PHOTO_MIME[mime];
    if (!allowedExts) throw codedError('Only JPG, PNG, and WebP images are allowed', { statusCode: 400, code: 'VALIDATION_ERROR' });
    if (buffer.length > MAX_PHOTO_BYTES) throw codedError('Image must be 5 MB or smaller', { statusCode: 400, code: 'VALIDATION_ERROR' });
    const ext = (filename.split('.').pop() ?? '').toLowerCase();
    if (!allowedExts.includes(ext)) throw codedError('File extension does not match image type', { statusCode: 400, code: 'VALIDATION_ERROR' });
    const count = await prisma.gymPhoto.count({ where: { gymId } });
    if (count >= MAX_PHOTOS_PER_GYM) throw codedError('A gym can have at most 10 photos', { statusCode: 400, code: 'VALIDATION_ERROR' });
    const { url } = await storage.upload(buffer, { mime, ext });
    try {
      const image = await prisma.$transaction(async (tx) => {
        const maxSort = await tx.gymPhoto.aggregate({ where: { gymId }, _max: { sortOrder: true } });
        const created = await tx.gymPhoto.create({
          data: { gymId, url, isPrimary: count === 0, sortOrder: (maxSort._max.sortOrder ?? -1) + 1 },
        });
        const imageUrl = created.isPrimary ? url : ((await tx.gym.findUnique({ where: { id: gymId }, select: { imageUrl: true } }))?.imageUrl ?? url);
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
    const image = await prisma.gymPhoto.findFirst({ where: { id: photoId, gymId } });
    if (!image) throw codedError('Photo not found', { statusCode: 404, code: 'PHOTO_NOT_FOUND' });
    await prisma.gymPhoto.delete({ where: { id: photoId } });
    await storage.delete(image.url).catch(() => undefined);
    await this.syncImageUrl(gymId);
    return { deleted: true };
  }

  async setPrimaryPhoto(gymId: string, ownerId: string, photoId: string) {
    await this.requireOwnedGym(gymId, ownerId);
    const image = await prisma.gymPhoto.findFirst({ where: { id: photoId, gymId } });
    if (!image) throw codedError('Photo not found', { statusCode: 404, code: 'PHOTO_NOT_FOUND' });
    await prisma.$transaction(async (tx) => {
      await tx.gymPhoto.updateMany({ where: { gymId }, data: { isPrimary: false } });
      await tx.gymPhoto.update({ where: { id: photoId }, data: { isPrimary: true } });
      await tx.gym.update({ where: { id: gymId }, data: { imageUrl: image.url } });
    });
    return prisma.gymPhoto.findUnique({ where: { id: photoId } });
  }

  async updatePhoto(gymId: string, ownerId: string, photoId: string, input: { altText?: string | null; sortOrder?: number }) {
    await this.requireOwnedGym(gymId, ownerId);
    const image = await prisma.gymPhoto.findFirst({ where: { id: photoId, gymId } });
    if (!image) throw codedError('Photo not found', { statusCode: 404, code: 'PHOTO_NOT_FOUND' });
    return prisma.gymPhoto.update({ where: { id: photoId }, data: { ...(input.altText !== undefined ? { altText: input.altText } : {}), ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}) } });
  }

  // Plans
  private normalizePlanInput(input: CreateMembershipPlanInput | UpdateMembershipPlanInput) {
    const out: Prisma.MembershipPlanCreateInput | Prisma.MembershipPlanUpdateInput & { durationDays?: number } = {};
    const rec = input as Record<string, unknown>;
    if (rec.name != null) (out as Record<string, unknown>).name = rec.name;
    if (rec.description !== undefined) (out as Record<string, unknown>).description = rec.description;
    if (rec.price != null) (out as Record<string, unknown>).price = rec.price as number;
    const dd = (rec.durationDays as number | undefined) ?? (rec.duration as number | undefined);
    if (dd != null) (out as Record<string, unknown>).durationDays = dd;
    if (rec.features !== undefined) (out as Record<string, unknown>).features = rec.features;
    if (rec.isActive !== undefined) (out as Record<string, unknown>).isActive = rec.isActive;
    return out as Prisma.MembershipPlanUncheckedCreateInput & Prisma.MembershipPlanUncheckedUpdateInput;
  }

  async createMembershipPlan(gymId: string, ownerId: string, input: CreateMembershipPlanInput) {
    const gym = await prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) throw codedError('Gym not found', { statusCode: 404, code: 'GYM_NOT_FOUND' });
    if (gym.ownerId !== ownerId) throw codedError('Not authorized', { statusCode: 403, code: 'FORBIDDEN' });
    const data = this.normalizePlanInput(input);
    if ((data as { durationDays?: number }).durationDays == null) throw codedError('durationDays is required', { statusCode: 400, code: 'VALIDATION_ERROR' });
    const plan = await prisma.membershipPlan.create({ data: { ...(data as Prisma.MembershipPlanUncheckedCreateInput), gymId } });
    return { ...plan, price: decimalToNumber(plan.price as never) ?? 0 };
  }

  async getMembershipPlans(gymId: string, includeInactive = false) {
    const plans = await prisma.membershipPlan.findMany({
      where: { gymId, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: { price: 'asc' },
    });
    return plans.map((p) => ({ ...p, price: decimalToNumber(p.price as never) ?? 0 }));
  }

  async updateMembershipPlan(planId: string, gymId: string, ownerId: string, input: UpdateMembershipPlanInput) {
    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan) throw codedError('Plan not found', { statusCode: 404, code: 'PLAN_NOT_FOUND' });
    if (plan.gymId !== gymId) throw codedError('Plan does not belong to this gym', { statusCode: 400, code: 'VALIDATION_ERROR' });
    const gym = await prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym || gym.ownerId !== ownerId) throw codedError('Not authorized', { statusCode: 403, code: 'FORBIDDEN' });
    const updated = await prisma.membershipPlan.update({ where: { id: planId }, data: this.normalizePlanInput(input) as Prisma.MembershipPlanUpdateInput });
    return { ...updated, price: decimalToNumber(updated.price as never) ?? 0 };
  }

  async deleteMembershipPlan(planId: string, gymId: string, ownerId: string) {
    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan) throw codedError('Plan not found', { statusCode: 404, code: 'PLAN_NOT_FOUND' });
    if (plan.gymId !== gymId) throw codedError('Plan does not belong to this gym', { statusCode: 400, code: 'VALIDATION_ERROR' });
    const gym = await prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym || gym.ownerId !== ownerId) throw codedError('Not authorized', { statusCode: 403, code: 'FORBIDDEN' });
    await prisma.membershipPlan.delete({ where: { id: planId } });
    return { deleted: true };
  }
}
