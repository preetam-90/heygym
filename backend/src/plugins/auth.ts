import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../config/env';

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
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
    refreshAuthenticate: (request: any, reply: any) => Promise<void>;
    requireRole: (...roles: string[]) => (request: any, reply: any) => Promise<void>;
  }
}