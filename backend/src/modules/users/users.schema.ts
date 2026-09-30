import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().regex(/^[+0-9()\-\s]{7,20}$/, 'Invalid phone number').nullable().optional(),
    avatarUrl: z.string().url().nullable().optional(),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
