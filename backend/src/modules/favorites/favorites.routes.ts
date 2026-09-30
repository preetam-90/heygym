import { FastifyPluginAsync } from 'fastify';
import { FavoritesService } from './favorites.service';
import { isCodedError } from '../../lib/errors';

export const favoritesRoutes: FastifyPluginAsync = async (fastify) => {
  const svc = new FavoritesService();

  fastify.route({
    method: 'POST',
    url: '/users/me/favorites/:gymId',
    preHandler: fastify.authenticate,
    handler: async (req, reply) => {
      try {
        const fav = await svc.add(req.user.id, (req.params as { gymId: string }).gymId);
        return reply.status(201).send({ success: true, data: { favorite: fav } });
      } catch (e: unknown) {
        if (isCodedError(e)) return reply.status(e.statusCode).send({ success: false, error: { code: e.code, message: e.message } });
        return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to add favorite' } });
      }
    },
  });

  fastify.route({
    method: 'DELETE',
    url: '/users/me/favorites/:gymId',
    preHandler: fastify.authenticate,
    handler: async (req, reply) => {
      const result = await svc.remove(req.user.id, (req.params as { gymId: string }).gymId);
      return reply.send({ success: true, data: result });
    },
  });

  fastify.route({
    method: 'GET',
    url: '/users/me/favorites',
    preHandler: fastify.authenticate,
    handler: async (req, reply) => {
      const q = req.query as { page?: string; pageSize?: string };
      const result = await svc.list(req.user.id, q.page ? parseInt(q.page, 10) : 1, q.pageSize ? parseInt(q.pageSize, 10) : 20);
      return reply.send({ success: true, data: result });
    },
  });
};
