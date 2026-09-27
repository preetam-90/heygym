import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];