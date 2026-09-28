import { z } from 'zod';

export const updateGymStatusSchema = z.object({
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    reason: z.string().max(1000).optional(),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export type UpdateGymStatusInput = z.infer<typeof updateGymStatusSchema>['body'];