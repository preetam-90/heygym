import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { writeAudit } from '../lib/audit';
import { buildRequirePermission } from './permissions';

export const authPlugin: FastifyPluginAsync = fp(async (fastify) => {
  await fastify.register(import('@fastify/jwt'), {
    secret: {
      private: env.JWT_ACCESS_SECRET,
      public: env.JWT_ACCESS_SECRET,
    },
    sign: {
      expiresIn: '15m',
    },
    verify: {
      algorithms: ['HS256'],
    },
  });

  await fastify.register(import('@fastify/jwt'), {
    secret: {
      private: env.JWT_REFRESH_SECRET,
      public: env.JWT_REFRESH_SECRET,
    },
    sign: {
      expiresIn: '7d',
    },
    verify: {
      algorithms: ['HS256'],
    },
    namespace: 'refresh',
  });

  await fastify.register(import('@fastify/cookie'), {
    secret: env.JWT_ACCESS_SECRET,
    hook: 'onRequest',
    parseOptions: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  });

  fastify.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // Suspended/banned enforcement: a valid JWT must not grant access when
    // the account is no longer ACTIVE. Per-request lookup so suspension
    // takes effect immediately (no stale cache window).
    const tokenUserId = (request.user as any)?.id;
    if (tokenUserId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: tokenUserId },
        select: { id: true, status: true },
      });
      if (!dbUser) {
        return reply.status(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User no longer exists',
          },
        });
      }
      if (dbUser.status === 'SUSPENDED' || dbUser.status === 'BANNED') {
        const code = dbUser.status === 'SUSPENDED' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_BANNED';
        try {
          await writeAudit({
            actorId: dbUser.id,
            action: dbUser.status === 'SUSPENDED' ? 'auth.suspended_blocked' : 'auth.banned_blocked',
            targetType: 'User',
            targetId: dbUser.id,
            ip: request.ip ?? null,
          });
        } catch {
          // Audit failure must never break (or bypass) the auth decision.
        }
        return reply.status(403).send({
          success: false,
          error: {
            code,
            message:
              dbUser.status === 'SUSPENDED'
                ? 'Account is suspended'
                : 'Account is banned',
          },
        });
      }
    }
  });

  fastify.decorate('refreshAuthenticate', async function (request: any, reply: any) {
    try {
      await request.refreshJwtVerify();
    } catch (err) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid refresh token',
        },
      });
    }
  });

  fastify.decorate('requireRole', function (...roles: string[]) {
    return async function (request: any, reply: any) {
      await request.jwtVerify();
      const userRole = request.user.role;
      if (!roles.includes(userRole)) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
        });
      }
    };
  });

  fastify.decorate('requirePermission', buildRequirePermission());
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
    refreshAuthenticate: (request: any, reply: any) => Promise<void>;
    requireRole: (...roles: string[]) => (request: any, reply: any) => Promise<void>;
    requirePermission: (permission: string) => (request: any, reply: any) => Promise<void>;
  }
}