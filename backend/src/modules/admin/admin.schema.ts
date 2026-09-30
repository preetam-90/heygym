import { z } from 'zod';

export const updateGymStatusSchema = z.object({
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED', 'DRAFT', 'PENDING_APPROVAL']),
    reason: z.string().max(1000).optional(),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const adminActionSchema = z.object({
  body: z.object({
    reason: z.string().max(1000).optional(),
  }),
});

export type UpdateGymStatusInput = z.infer<typeof updateGymStatusSchema>['body'];
