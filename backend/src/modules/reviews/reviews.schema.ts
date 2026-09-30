import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5),
    title: z.string().max(120).optional(),
    comment: z.string().max(2000).optional(),
  }),
  params: z.object({ gymId: z.string().cuid() }),
});

export const updateReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    title: z.string().max(120).nullable().optional(),
    comment: z.string().max(2000).nullable().optional(),
  }),
});
