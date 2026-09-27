import { z } from 'zod';

export const createGymSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    imageUrl: z.string().url().optional(),
  }),
});

export const updateGymSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    address: z.string().min(5).optional(),
    city: z.string().min(2).optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    imageUrl: z.string().url().optional(),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const gymIdSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
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