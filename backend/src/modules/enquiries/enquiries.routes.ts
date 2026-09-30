import { FastifyPluginAsync } from 'fastify';
import { EnquiriesService } from './enquiries.service';
import { EnquiriesController } from './enquiries.controller';

export const enquiriesRoutes: FastifyPluginAsync = async (fastify) => {
  const svc = new EnquiriesService();
  const ctrl = new EnquiriesController(svc);

  // User creates enquiry for a gym (must be authenticated, gym must be APPROVED)
  fastify.route({
    method: 'POST',
    url: '/gyms/:gymId/enquiries',
    preHandler: [fastify.authenticate, fastify.requireRole('USER', 'GYM_OWNER', 'ADMIN')],
    handler: ctrl.create.bind(ctrl),
  });

  // Current user's own enquiries
  fastify.route({
    method: 'GET',
    url: '/users/me/enquiries',
    preHandler: fastify.authenticate,
    handler: ctrl.listMine.bind(ctrl),
  });
};
