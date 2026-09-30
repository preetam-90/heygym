import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../lib/prisma';

export const notificationsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.route({
    method: 'GET',
    url: '/users/me/notifications',
    preHandler: fastify.authenticate,
    handler: async (req, reply) => {
      const q = req.query as { page?: string; pageSize?: string; unread?: string };
      const page = q.page ? parseInt(q.page, 10) : 1;
      const pageSize = Math.min(q.pageSize ? parseInt(q.pageSize, 10) : 20, 100);
      const where = { userId: req.user.id, ...(q.unread === 'true' ? { readAt: null } : {}) };
      const [total, unreadCount, notifications] = await Promise.all([
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId: req.user.id, readAt: null } }),
        prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      ]);
      return reply.send({ success: true, data: { notifications, unreadCount, meta: { total, page, pageSize } } });
    },
  });

  fastify.route({
    method: 'POST',
    url: '/users/me/notifications/:id/read',
    preHandler: fastify.authenticate,
    handler: async (req, reply) => {
      const id = (req.params as { id: string }).id;
      const notif = await prisma.notification.findFirst({ where: { id, userId: req.user.id } });
      if (!notif) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
      const updated = await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
      return reply.send({ success: true, data: { notification: updated } });
    },
  });

  fastify.route({
    method: 'POST',
    url: '/users/me/notifications/read-all',
    preHandler: fastify.authenticate,
    handler: async (req, reply) => {
      await prisma.notification.updateMany({ where: { userId: req.user.id, readAt: null }, data: { readAt: new Date() } });
      return reply.send({ success: true, data: { updated: true } });
    },
  });
};
