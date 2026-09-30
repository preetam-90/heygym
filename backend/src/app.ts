import 'dotenv/config';
import { FastifyInstance } from 'fastify';
import { mkdirSync } from 'fs';
import path from 'path';
import { corsPlugin } from './plugins/cors';
import { authPlugin } from './plugins/auth';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { gymsRoutes } from './modules/gyms/gyms.routes';
import { ownerRoutes } from './modules/owner/owner.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { auditRoutes } from './modules/audit/audit.routes';
import { enquiriesRoutes } from './modules/enquiries/enquiries.routes';
import { favoritesRoutes } from './modules/favorites/favorites.routes';
import { reviewsRoutes } from './modules/reviews/reviews.routes';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { prisma } from './lib/prisma';

export async function createApp(): Promise<FastifyInstance> {
  const fastify = (await import('fastify')).default({
    logger: process.env.NODE_ENV !== 'production' ? { level: 'info' } : true,
    bodyLimit: 1024 * 1024, // 1MB JSON limit
  });

  await fastify.register(corsPlugin);
  await fastify.register(authPlugin);

  try {
    await fastify.register(import('@fastify/helmet'), { global: true });
  } catch {
    // helmet optional if not installed
  }
  try {
    await fastify.register(import('@fastify/rate-limit'), { max: 200, timeWindow: '1 minute' });
  } catch {
    // rate-limit optional if not installed
  }

  await fastify.register(import('@fastify/multipart'), {
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  });

  const uploadsDir = process.env.STORAGE_DIR ?? path.join(__dirname, '..', 'uploads');
  mkdirSync(uploadsDir, { recursive: true });

  await fastify.register(import('@fastify/static'), {
    root: uploadsDir,
    prefix: '/uploads/',
  });

  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
  fastify.get('/ready', async (_req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'up' };
    } catch {
      return reply.status(503).send({ status: 'error', db: 'down' });
    }
  });

  // OpenAPI placeholder (full spec in docs/openapi.yaml)
  fastify.get('/api/v1/openapi.json', async () => {
    try {
      const { readFileSync, existsSync } = await import('fs');
      const p = path.join(__dirname, '..', 'docs', 'openapi.json');
      if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'));
    } catch {
      // fallthrough
    }
    return { openapi: '3.0.0', info: { title: 'HeyGym API', version: '1.0.0' }, paths: {} };
  });

  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(usersRoutes, { prefix: '/api/v1/users' });
  await fastify.register(gymsRoutes, { prefix: '/api/v1/gyms' });
  await fastify.register(ownerRoutes, { prefix: '/api/v1/owner' });
  await fastify.register(adminRoutes, { prefix: '/api/v1/admin' });
  await fastify.register(auditRoutes, { prefix: '/api/v1/admin' });
  await fastify.register(enquiriesRoutes, { prefix: '/api/v1' });
  await fastify.register(favoritesRoutes, { prefix: '/api/v1' });
  await fastify.register(reviewsRoutes, { prefix: '/api/v1' });
  await fastify.register(notificationsRoutes, { prefix: '/api/v1' });

  fastify.setErrorHandler((error, request, reply) => {
    const typed = error as { statusCode?: number; code?: string; validation?: unknown };
    // Preserve coded errors thrown from services
    if (typed.statusCode && typed.code) {
      return reply.status(typed.statusCode).send({ success: false, error: { code: typed.code, message: error.message } });
    }
    if (typed.validation) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request' } });
    }
    if (typed.statusCode === 429) {
      return reply.status(429).send({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } });
    }
    fastify.log.error({ err: error, method: request.method, url: request.url });
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      },
    });
  });

  fastify.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  return fastify;
}
