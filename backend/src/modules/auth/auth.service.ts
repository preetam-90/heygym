import { prisma } from '../../lib/prisma';
import argon2 from 'argon2';
import { createHash, randomUUID } from 'crypto';
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

/**
 * Consume one throttle slot for a failed attempt, auditing when the limit
 * trips. Auditing is best-effort — an audit failure must never change the
 * throttle decision — and the original throttle error is always rethrown.
 */
async function consumeLoginThrottle(key: string, email: string, ip?: string) {
  try {
    checkLoginThrottle(key);
  } catch (err) {
    try {
      await writeAudit({
        action: 'auth.login_throttled',
        targetType: 'User',
        reason: email.trim().toLowerCase(),
        ip: ip ?? null,
      });
    } catch {
      // Audit failure must never change the throttle decision.
    }
    throw err;
  }
}

/** Record a failed login without ever letting audit problems affect auth. */
async function auditLoginFailure(opts: {
  actorId?: string;
  targetId?: string;
  reason?: string;
  ip?: string;
}) {
  try {
    await writeAudit({
      actorId: opts.actorId ?? null,
      action: 'auth.login_failed',
      targetType: 'User',
      targetId: opts.targetId ?? null,
      reason: opts.reason ?? null,
      ip: opts.ip ?? null,
    });
  } catch {
    // Audit failure must never change the auth decision.
  }
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

    if ((input as { phone?: string }).phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone: (input as { phone?: string }).phone! } }).catch(() => null);
      if (existingPhone) throw new Error('Phone already registered');
    }

    const passwordHash = await argon2.hash(input.password);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        // Role is trusted server-side: schema only allows USER/GYM_OWNER, never ADMIN
        role: input.role,
        ...((input as { phone?: string }).phone ? { phone: (input as { phone?: string }).phone } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
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
      await consumeLoginThrottle(key, input.email, opts?.ip);
      await auditLoginFailure({
        reason: `unknown email: ${input.email.trim().toLowerCase()}`,
        ip: opts?.ip,
      });
      throw new Error('Invalid credentials');
    }

    const isValid = await argon2.verify(user.passwordHash, input.password);
    if (!isValid) {
      await consumeLoginThrottle(key, input.email, opts?.ip);
      await auditLoginFailure({ actorId: user.id, targetId: user.id, ip: opts?.ip });
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

    await consumeLoginThrottle(key, input.email, opts?.ip);
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

    const refreshToken = (this.fastify as unknown as { jwt: { refresh: { sign: (p: unknown, o: unknown) => string } } }).jwt.refresh.sign(
      { id: user.id, email: user.email, role: user.role, jti: randomUUID() },
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async createSession(userId: string, refreshToken: string, opts?: { ip?: string; userAgent?: string }) {
    const tokenHash = this.hashToken(refreshToken);
    await prisma.refreshSession.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ip: opts?.ip,
        userAgent: opts?.userAgent,
      },
    });
    // Opportunistic cleanup: delete expired sessions for this user
    await prisma.refreshSession.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } }).catch(() => null);
  }

  async revokeSession(refreshToken: string) {
    try {
      await prisma.refreshSession.update({
        where: { tokenHash: this.hashToken(refreshToken) },
        data: { revokedAt: new Date() },
      });
    } catch {
      // already gone / never existed — logout is idempotent
    }
  }

  async revokeAllForUser(userId: string) {
    await prisma.refreshSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
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
        phone: true,
        avatarUrl: true,
        role: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async refreshTokens(refreshToken: string) {
    try {
      const decoded = (this.fastify as unknown as { jwt: { refresh: { verify: (t: string) => { id: string } } } }).jwt.refresh.verify(refreshToken);
      const tokenHash = this.hashToken(refreshToken);
      const session = await prisma.refreshSession.findUnique({ where: { tokenHash } });
      if (!session || session.revokedAt || session.expiresAt < new Date()) {
        throw new Error('Invalid refresh token');
      }
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

      // Rotation: revoke old session, issue new pair
      await prisma.refreshSession.update({ where: { tokenHash }, data: { revokedAt: new Date() } }).catch(() => null);
      const tokens = this.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      await this.createSession(user.id, tokens.refreshToken);
      return tokens;
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