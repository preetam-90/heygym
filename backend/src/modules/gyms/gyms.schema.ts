import { z } from 'zod';

export const FACILITIES = [
  'Cardio',
  'Weight Training',
  'CrossFit',
  'Yoga',
  'Parking',
  'Locker',
  'Shower',
  'AC',
  'Personal Training',
] as const;

const phoneRegex = /^[+0-9()\-\s]{7,20}$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Keys the owner must never write directly (status flow is server-driven). */
export const OWNER_FORBIDDEN_KEYS = [
  'status',
  'ownerId',
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
  facilities: z.array(z.enum(FACILITIES)).max(20).optional(),
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

export const createMembershipPlanSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive'),
    duration: z.number().int().positive('Duration must be positive'),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const updateMembershipPlanSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    duration: z.number().int().positive().optional(),
  }),
  params: z.object({
    id: z.string().cuid(),
    planId: z.string().cuid(),
  }),
});

export type CreateGymInput = z.infer<typeof createGymSchema>['body'];
export type UpdateGymInput = z.infer<typeof updateGymSchema>['body'];
export type CreateMembershipPlanInput = z.infer<typeof createMembershipPlanSchema>['body'];
export type UpdateMembershipPlanInput = z.infer<typeof updateMembershipPlanSchema>['body'];
