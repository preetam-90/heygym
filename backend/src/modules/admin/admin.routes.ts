import { FastifyPluginAsync } from 'fastify';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  const adminService = new AdminService();
  const adminController = new AdminController(adminService);
  const adminGuard = [fastify.authenticate, fastify.requireRole('ADMIN')];

  fastify.route({ method: 'GET', url: '/users', preHandler: adminGuard, handler: adminController.getUsers.bind(adminController) });
  fastify.route({ method: 'GET', url: '/gyms', preHandler: adminGuard, handler: adminController.getGyms.bind(adminController) });
  fastify.route({ method: 'GET', url: '/gyms/pending', preHandler: adminGuard, handler: adminController.getPendingGyms.bind(adminController) });
  fastify.route({ method: 'GET', url: '/gyms/:id', preHandler: adminGuard, handler: adminController.getGymById.bind(adminController) });
  fastify.route({ method: 'POST', url: '/gyms/:id/approve', preHandler: [...adminGuard, fastify.requirePermission('gyms.approve')], handler: adminController.approve.bind(adminController) });
  fastify.route({ method: 'POST', url: '/gyms/:id/reject', preHandler: [...adminGuard, fastify.requirePermission('gyms.approve')], handler: adminController.reject.bind(adminController) });
  fastify.route({ method: 'POST', url: '/gyms/:id/suspend', preHandler: [...adminGuard, fastify.requirePermission('gyms.approve')], handler: adminController.suspend.bind(adminController) });
  fastify.route({ method: 'POST', url: '/gyms/:id/restore', preHandler: [...adminGuard, fastify.requirePermission('gyms.approve')], handler: adminController.restore.bind(adminController) });
  // Legacy compat
  fastify.route({ method: 'PATCH', url: '/gyms/:id/status', preHandler: [...adminGuard, fastify.requirePermission('gyms.approve')], handler: adminController.updateGymStatus.bind(adminController) });

  fastify.route({ method: 'GET', url: '/stats', preHandler: adminGuard, handler: adminController.getStats.bind(adminController) });
  fastify.route({ method: 'GET', url: '/enquiries', preHandler: adminGuard, handler: adminController.listEnquiries.bind(adminController) });
};
