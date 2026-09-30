import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(/^[+0-9()\-\s]{7,20}$/, 'Invalid phone number').optional(),
    // Min 8 chars; production clients should enforce mixed case + number.
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    role: z.enum(['USER', 'GYM_OWNER']).default('USER'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

export const confirmResetSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token required'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshInput = z.infer<typeof refreshSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
export type ConfirmResetInput = z.infer<typeof confirmResetSchema>['body'];