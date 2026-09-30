import { z } from 'zod';

const phoneRegex = /^[+0-9()\-\s]{7,20}$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Keys the owner must never write directly (status flow is server-driven). */
export const OWNER_FORBIDDEN_KEYS = [
  'status',
  'ownerId',
  'slug',
  'imageUrl',
  'rejectionReason',
  'internalNotes',
  'verifiedAt',
  'deletedAt',
] as const;

const gymInfoFields = {
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().max(2000).optional(),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().max(100).optional(),
  pincode: z.string().regex(pincodeRegex, 'Invalid pincode').optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  phone: z.string().regex(phoneRegex, 'Invalid phone number').optional(),
  email: z.string().email('Invalid email address').optional(),
  website: z.string().url('Invalid website URL').optional(),
  services: z.array(z.string().min(2).max(80)).max(30).optional(),
  openingTime: z.string().regex(timeRegex, 'Opening time must be HH:MM').optional(),
  closingTime: z.string().regex(timeRegex, 'Closing time must be HH:MM').optional(),
};

const hoursRefine = (data: { openingTime?: string; closingTime?: string }) => {
  if (data.openingTime && data.closingTime && data.openingTime === data.closingTime) return false;
  return true;
};

export const createGymSchema = z.object({
  body: z
    .object(gymInfoFields)
    .strict()
    .refine(hoursRefine, { message: 'Opening and closing times must differ', path: ['closingTime'] }),
});

const optionalGymInfoFields = Object.fromEntries(
  Object.entries(gymInfoFields).map(([key, schema]) => [key, (schema as z.ZodTypeAny).optional()]),
) as { [K in keyof typeof gymInfoFields]: z.ZodOptional<z.ZodTypeAny> };

export const updateGymSchema = z.object({
  body: z
    .object({
      ...optionalGymInfoFields,
      name: z.string().min(2).max(120).optional(),
      address: z.string().min(5).optional(),
      city: z.string().min(2).optional(),
    })
    .strict()
    .refine(hoursRefine, { message: 'Opening and closing times must differ', path: ['closingTime'] }),
});

export const gymIdSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const gymPhotoIdSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
    photoId: z.string().cuid(),
  }),
});

export const gymPhotoUpdateSchema = z.object({
  body: z
    .object({
      altText: z.string().max(200).nullable().optional(),
      sortOrder: z.number().int().min(0).max(1000).optional(),
    })
    .strict(),
  params: z.object({
    id: z.string().cuid(),
    photoId: z.string().cuid(),
  }),
});

export const gymFacilitySchema = z.object({
  body: z.object({
    facilityId: z.string().min(1).optional(),
    facilityIds: z.array(z.string().min(1)).max(30).optional(),
    slug: z.string().min(1).max(120).optional(),
  }),
});

export const gymHoursSchema = z.object({
  body: z.object({
    hours: z
      .array(
        z.object({
          dayOfWeek: z.number().int().min(0).max(6),
          openTime: z.string().regex(timeRegex).nullable().optional(),
          closeTime: z.string().regex(timeRegex).nullable().optional(),
          isClosed: z.boolean().optional(),
        }),
      )
      .min(1)
      .max(7),
  }),
});

export const createMembershipPlanSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(120),
    description: z.string().max(1000).optional(),
    price: z.number().positive('Price must be positive').max(10_000_000),
    durationDays: z.number().int().positive('Duration must be positive').max(3650),
    // Backward compat: accept legacy `duration` as alias for durationDays
    duration: z.number().int().positive().optional(),
    features: z.array(z.string().min(1).max(200)).max(30).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const updateMembershipPlanSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    description: z.string().max(1000).nullable().optional(),
    price: z.number().positive().max(10_000_000).optional(),
    durationDays: z.number().int().positive().max(3650).optional(),
    duration: z.number().int().positive().max(3650).optional(),
    features: z.array(z.string().min(1).max(200)).max(30).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().cuid(),
    planId: z.string().cuid(),
  }),
});

export const GYM_SORTS = ['nearest', 'rating', 'price_low', 'price_high', 'newest'] as const;
// Legacy aliases accepted from older clients
const LEGACY_SORT_MAP: Record<string, (typeof GYM_SORTS)[number]> = {
  price_asc: 'price_low',
  price_desc: 'price_high',
  name: 'newest',
};

/**
 * Query params for the public gym directory. Values arrive as strings, so
 * numerics are coerced; an absent param stays undefined rather than NaN.
 */
export const gymsQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(120).optional(),
    city: z.string().trim().min(1).max(100).optional(),
    facilities: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((value) => {
        if (value == null) return undefined;
        const list = (Array.isArray(value) ? value : value.split(','))
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean);
        return list.length > 0 ? list : undefined;
      }),
    minPrice: z.coerce.number().positive().max(10_000_000).optional(),
    maxPrice: z.coerce.number().positive().max(10_000_000).optional(),
    minRating: z.coerce.number().min(1).max(5).optional(),
    sort: z.string().trim().max(20).optional().transform((v) => {
      if (!v) return undefined;
      if ((GYM_SORTS as readonly string[]).includes(v)) return v as (typeof GYM_SORTS)[number];
      return LEGACY_SORT_MAP[v];
    }),
    page: z.coerce.number().int().min(1).max(1000).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radius: z.coerce.number().positive().max(100).optional(),
    radiusKm: z.coerce.number().positive().max(100).optional(),
  })
  .refine((value) => (value.lat == null) === (value.lng == null), {
    message: 'lat and lng must be provided together',
    path: ['lat'],
  })
  .transform((v) => ({
    ...v,
    pageSize: v.pageSize ?? v.limit,
    radiusKm: v.radiusKm ?? v.radius,
  }));

export type GymsQuery = z.infer<typeof gymsQuerySchema>;

export type CreateGymInput = z.infer<typeof createGymSchema>['body'];
export type UpdateGymInput = z.infer<typeof updateGymSchema>['body'];
export type CreateMembershipPlanInput = z.infer<typeof createMembershipPlanSchema>['body'];
export type UpdateMembershipPlanInput = z.infer<typeof updateMembershipPlanSchema>['body'];
