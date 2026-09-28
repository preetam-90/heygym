import { FastifyInstance } from 'fastify';
import { corsPlugin } from './plugins/cors';
import { authPlugin } from './plugins/auth';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { gymsRoutes } from './modules/gyms/gyms.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { auditRoutes } from './modules/audit/audit.routes';

export async function createApp(): Promise<FastifyInstance> {
  const fastify = (await import('fastify')).default({
    logger: process.env.NODE_ENV !== 'production',
  });

  await fastify.register(corsPlugin);
  await fastify.register(authPlugin);

  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(usersRoutes, { prefix: '/api/v1/users' });
  await fastify.register(gymsRoutes, { prefix: '/api/v1/gyms' });
  await fastify.register(adminRoutes, { prefix: '/api/v1/admin' });
  await fastify.register(auditRoutes, { prefix: '/api/v1/admin' });

  fastify.setErrorHandler((error, _request, reply) => {
    fastify.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      },
    });
  });

  fastify.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    });
  });

  return fastify;
}