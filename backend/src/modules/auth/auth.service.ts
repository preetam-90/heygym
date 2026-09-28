import { prisma } from '../../lib/prisma';
import argon2 from 'argon2';
import { FastifyInstance } from 'fastify';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schema';
import { writeAudit } from '../../lib/audit';

/** Thrown when the login throttle trips. Mapped to 429 by the controller. */
export class ThrottledError extends Error {
  code = 'RATE_LIMITED';
  statusCode = 429;
}

/** Thrown when a non-ACTIVE account attempts login. Mapped to 403. */
export class AccountBlockedError extends Error {
  code: string;
  statusCode = 403;
  constructor(code: 'ACCOUNT_SUSPENDED' | 'ACCOUNT_BANNED', message: string) {
    super(message);
    this.code = code;
  }
}

/** Login throttle: max attempts per IP+email inside a sliding window. */
const LOGIN_ATTEMPT_LIMIT = 10;
const LOGIN_ATTEMPT_WINDOW_MS = 5 * 60 * 1000;
const loginAttempts = new Map<string, number[]>();

function throttleKey(ip: string | undefined, email: string) {
  return `${ip ?? 'unknown'}:${email.trim().toLowerCase()}`;
}

function checkLoginThrottle(key: string) {
  const now = Date.now();
  const windowStart = now - LOGIN_ATTEMPT_WINDOW_MS;
  const attempts = (loginAttempts.get(key) ?? []).filter((t) => t > windowStart);
  if (attempts.length >= LOGIN_ATTEMPT_LIMIT) {
    loginAttempts.set(key, attempts);
    throw new ThrottledError('Too many login attempts. Please try again later.');
  }
  attempts.push(now);
  loginAttempts.set(key, attempts);
}

function clearLoginThrottle(key: string) {
  loginAttempts.delete(key);
}

export class AuthService {
  constructor(private fastify: FastifyInstance) {}

  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    const passwordHash = await argon2.hash(input.password);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(input: LoginInput, opts?: { ip?: string }) {
    const key = throttleKey(opts?.ip, input.email);

    // Look up the user and verify credentials BEFORE touching the throttle
    // budget, so blocked accounts always get 403 regardless of attempt count
    // and only genuine credential failures consume throttle budget.
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      try {
        checkLoginThrottle(key);
      } catch (err) {
        try {
          await writeAudit({
            action: 'auth.login_throttled',
            targetType: 'User',
            reason: input.email.trim().toLowerCase(),
            ip: opts?.ip ?? null,
          });
        } catch {
          // Audit failure must never change the throttle decision.
        }
        throw err;
      }
      try {
        await writeAudit({
          action: 'auth.login_failed',
          targetType: 'User',
          reason: `unknown email: ${input.email.trim().toLowerCase()}`,
          ip: opts?.ip ?? null,
        });
      } catch {
        // Audit failure must never change the auth decision.
      }
      throw new Error('Invalid credentials');
    }

    const isValid = await argon2.verify(user.passwordHash, input.password);
    if (!isValid) {
      try {
        checkLoginThrottle(key);
      } catch (err) {
        try {
          await writeAudit({
            action: 'auth.login_throttled',
            targetType: 'User',
            reason: input.email.trim().toLowerCase(),
            ip: opts?.ip ?? null,
          });
        } catch {
          // Audit failure must never change the throttle decision.
        }
        throw err;
      }
      try {
        await writeAudit({
          actorId: user.id,
          action: 'auth.login_failed',
          targetType: 'User',
          targetId: user.id,
          ip: opts?.ip ?? null,
        });
      } catch {
        // Audit failure must never change the auth decision.
      }
      throw new Error('Invalid credentials');
    }

    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      const code = user.status === 'SUSPENDED' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_BANNED';
      try {
        await writeAudit({
          actorId: user.id,
          action: user.status === 'SUSPENDED' ? 'auth.suspended_blocked' : 'auth.banned_blocked',
          targetType: 'User',
          targetId: user.id,
          ip: opts?.ip ?? null,
        });
      } catch {
        // Audit failure must never change the auth decision.
      }
      throw new AccountBlockedError(
        code,
        user.status === 'SUSPENDED' ? 'Account is suspended' : 'Account is banned'
      );
    }

    try {
      checkLoginThrottle(key);
    } catch (err) {
      try {
        await writeAudit({
          action: 'auth.login_throttled',
          targetType: 'User',
          reason: input.email.trim().toLowerCase(),
          ip: opts?.ip ?? null,
        });
      } catch {
        // Audit failure must never change the throttle decision.
      }
      throw err;
    }
    clearLoginThrottle(key);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return updated;
  }

  generateTokens(user: { id: string; email: string; role: string }) {
    const accessToken = this.fastify.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: '15m' }
    );

    const refreshToken = (this.fastify as any).jwt.refresh.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  setTokenCookies(reply: any, accessToken: string, refreshToken: string) {
    reply.setCookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
  }

  clearTokenCookies(reply: any) {
    reply.clearCookie('accessToken', { path: '/' });
    reply.clearCookie('refreshToken', { path: '/' });
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async refreshTokens(refreshToken: string) {
    try {
      const decoded = (this.fastify as any).jwt.refresh.verify(refreshToken);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
        throw new AccountBlockedError(
          user.status === 'SUSPENDED' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_BANNED',
          user.status === 'SUSPENDED' ? 'Account is suspended' : 'Account is banned'
        );
      }

      return this.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (e) {
      if (e instanceof AccountBlockedError) throw e;
      throw new Error('Invalid refresh token');
    }
  }

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      // Don't reveal whether user exists or not for security
      return { success: true, message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    return { success: true, message: 'If an account with that email exists, a password reset link has been sent.', resetToken };
  }

  async resetPassword(input: ResetPasswordInput) {
    const { token, password } = input;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const passwordHash = await argon2.hash(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { success: true, message: 'Password has been reset successfully' };
  }
}