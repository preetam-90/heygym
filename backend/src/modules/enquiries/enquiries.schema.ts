import { z } from 'zod';

export const createEnquirySchema = z.object({
  body: z.object({
    message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  }),
  params: z.object({ gymId: z.string().cuid() }),
});

export const updateEnquirySchema = z.object({
  body: z.object({
    status: z.enum(['NEW', 'READ', 'RESPONDED', 'CLOSED']).optional(),
    response: z.string().max(2000).nullable().optional(),
  }),
});

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>['body'];
export type UpdateEnquiryInput = z.infer<typeof updateEnquirySchema>['body'];
