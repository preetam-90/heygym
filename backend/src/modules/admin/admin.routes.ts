import { FastifyPluginAsync } from 'fastify';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  const adminService = new AdminService();
  const adminController = new AdminController(adminService);

  fastify.route({
    method: 'GET',
    url: '/users',
    preHandler: [fastify.authenticate, fastify.requireRole('ADMIN')],
    handler: adminController.getUsers.bind(adminController),
  });

  fastify.route({
    method: 'GET',
    url: '/gyms',
    preHandler: [fastify.authenticate, fastify.requireRole('ADMIN')],
    handler: adminController.getGyms.bind(adminController),
  });

  fastify.route({
    method: 'GET',
    url: '/stats',
    preHandler: [fastify.authenticate, fastify.requireRole('ADMIN')],
    handler: adminController.getStats.bind(adminController),
  });

  fastify.route({
    method: 'PATCH',
    url: '/gyms/:id/status',
    preHandler: [fastify.authenticate, fastify.requireRole('ADMIN'), fastify.requirePermission('gyms.approve')],
    handler: adminController.updateGymStatus.bind(adminController),
  });
};