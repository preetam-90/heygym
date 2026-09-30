import { FastifyPluginAsync } from 'fastify';
import { ZodError } from 'zod';
import { ReviewsService } from './reviews.service';
import { isCodedError } from '../../lib/errors';
import { createReviewSchema, updateReviewSchema } from './reviews.schema';
import { writeAudit } from '../../lib/audit';
import { prisma } from '../../lib/prisma';

export const reviewsRoutes: FastifyPluginAsync = async (fastify) => {
  const svc = new ReviewsService();

  fastify.route({
    method: 'POST',
    url: '/gyms/:gymId/reviews',
    preHandler: fastify.authenticate,
    handler: async (req, reply) => {
      try {
        const parsed = createReviewSchema.parse({ body: req.body ?? {}, params: req.params });
        const review = await svc.create(parsed.params.gymId, req.user.id, parsed.body);
        return reply.status(201).send({ success: true, data: { review } });
      } catch (e: unknown) {
        if (isCodedError(e)) return reply.status(e.statusCode).send({ success: false, error: { code: e.code, message: e.message } });
        if (e instanceof ZodError) return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: e.issues[0]?.message ?? 'Invalid input' } });
        return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create review' } });
      }
    },
  });

  fastify.route({
    method: 'GET',
    url: '/gyms/:gymId/reviews',
    handler: async (req, reply) => {
      const q = req.query as { page?: string; pageSize?: string };
      const result = await svc.list((req.params as { gymId: string }).gymId, q.page ? parseInt(q.page, 10) : 1, q.pageSize ? parseInt(q.pageSize, 10) : 20);
      return reply.send({ success: true, data: result });
    },
  });

  fastify.route({
    method: 'PATCH',
    url: '/reviews/:id',
    preHandler: fastify.authenticate,
    handler: async (req, reply) => {
      try {
        const parsed = updateReviewSchema.parse({ body: req.body ?? {} });
        const review = await svc.update((req.params as { id: string }).id, req.user.id, parsed.body);
        return reply.send({ success: true, data: { review } });
      } catch (e: unknown) {
        if (isCodedError(e)) return reply.status(e.statusCode).send({ success: false, error: { code: e.code, message: e.message } });
        return reply.status(400).send({ success: false, error: { code: 'UPDATE_ERROR', message: 'Failed to update review' } });
      }
    },
  });

  fastify.route({
    method: 'DELETE',
    url: '/reviews/:id',
    preHandler: fastify.authenticate,
    handler: async (req, reply) => {
      try {
        const isAdmin = req.user.role === 'ADMIN';
        const result = await svc.remove((req.params as { id: string }).id, req.user.id, isAdmin);
        return reply.send({ success: true, data: result });
      } catch (e: unknown) {
        if (isCodedError(e)) return reply.status(e.statusCode).send({ success: false, error: { code: e.code, message: e.message } });
        return reply.status(400).send({ success: false, error: { code: 'DELETE_ERROR', message: 'Failed to delete review' } });
      }
    },
  });

  // Admin moderation
  fastify.route({
    method: 'GET',
    url: '/admin/reviews',
    preHandler: [fastify.authenticate, fastify.requireRole('ADMIN')],
    handler: async (req, reply) => {
      const q = req.query as { page?: string; pageSize?: string; gymId?: string };
      const page = q.page ? parseInt(q.page, 10) : 1;
      const pageSize = Math.min(q.pageSize ? parseInt(q.pageSize, 10) : 20, 100);
      const where = q.gymId ? { gymId: q.gymId } : {};
      const [total, reviews] = await Promise.all([
        prisma.review.count({ where }),
        prisma.review.findMany({ where, include: { user: { select: { id: true, name: true } }, gym: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      ]);
      return reply.send({ success: true, data: { reviews, meta: { total, page, pageSize } } });
    },
  });

  fastify.route({
    method: 'POST',
    url: '/admin/reviews/:id/hide',
    preHandler: [fastify.authenticate, fastify.requireRole('ADMIN')],
    handler: async (req, reply) => {
      const review = await svc.setHidden((req.params as { id: string }).id, true);
      await writeAudit({ actorId: req.user.id, action: 'review.hide', targetType: 'review', targetId: review.id, ip: req.ip }).catch(() => null);
      return reply.send({ success: true, data: { review } });
    },
  });

  fastify.route({
    method: 'POST',
    url: '/admin/reviews/:id/restore',
    preHandler: [fastify.authenticate, fastify.requireRole('ADMIN')],
    handler: async (req, reply) => {
      const review = await svc.setHidden((req.params as { id: string }).id, false);
      await writeAudit({ actorId: req.user.id, action: 'review.restore', targetType: 'review', targetId: review.id, ip: req.ip }).catch(() => null);
      return reply.send({ success: true, data: { review } });
    },
  });
};
