import { FastifyPluginAsync } from 'fastify';
import { GymsController } from './gyms.controller';
import { GymsService } from './gyms.service';

const ownerOnly = (fastify: Parameters<FastifyPluginAsync>[0]) => [
  fastify.authenticate,
  fastify.requireRole('GYM_OWNER'),
];

export const gymsRoutes: FastifyPluginAsync = async (fastify) => {
  const gymsService = new GymsService();
  const gymsController = new GymsController(gymsService);
  const ownerGuard = ownerOnly(fastify);

  const optionalAuth = async (request: unknown, _reply: unknown) => {
    try {
      await (request as { jwtVerify: () => Promise<void> }).jwtVerify();
    } catch {
      // anonymous
    }
  };

  fastify.route({ method: 'GET', url: '/', handler: gymsController.getApprovedGyms.bind(gymsController) });
  fastify.route({ method: 'GET', url: '/facilities', handler: gymsController.listFacilities.bind(gymsController) });
  fastify.route({ method: 'GET', url: '/my', preHandler: ownerGuard, handler: gymsController.getMyGyms.bind(gymsController) });
  fastify.route({ method: 'GET', url: '/:id', preHandler: optionalAuth, handler: gymsController.getGymById.bind(gymsController) });
  fastify.route({ method: 'GET', url: '/:id/hours', handler: gymsController.getHours.bind(gymsController) });
  fastify.route({ method: 'POST', url: '/', preHandler: ownerGuard, handler: gymsController.createGym.bind(gymsController) });
  fastify.route({ method: 'PATCH', url: '/:id', preHandler: ownerGuard, handler: gymsController.updateGym.bind(gymsController) });
  fastify.route({ method: 'DELETE', url: '/:id', preHandler: ownerGuard, handler: gymsController.deleteGym.bind(gymsController) });
  fastify.route({ method: 'POST', url: '/:id/submit', preHandler: ownerGuard, handler: gymsController.submitGym.bind(gymsController) });

  fastify.route({ method: 'POST', url: '/:id/facilities', preHandler: ownerGuard, handler: gymsController.addFacility.bind(gymsController) });
  fastify.route({ method: 'DELETE', url: '/:id/facilities/:facilityId', preHandler: ownerGuard, handler: gymsController.removeFacility.bind(gymsController) });

  fastify.route({ method: 'PUT', url: '/:id/hours', preHandler: ownerGuard, handler: gymsController.setHours.bind(gymsController) });

  fastify.route({ method: 'POST', url: '/:id/photos', preHandler: ownerGuard, handler: gymsController.uploadPhoto.bind(gymsController) });
  fastify.route({ method: 'DELETE', url: '/:id/photos/:photoId', preHandler: ownerGuard, handler: gymsController.deletePhoto.bind(gymsController) });
  fastify.route({ method: 'PATCH', url: '/:id/photos/:photoId/primary', preHandler: ownerGuard, handler: gymsController.setPrimaryPhoto.bind(gymsController) });
  fastify.route({ method: 'PATCH', url: '/:id/photos/:photoId', preHandler: ownerGuard, handler: gymsController.updatePhoto.bind(gymsController) });

  fastify.route({
    method: 'POST',
    url: '/:id/membership-plans',
    preHandler: [fastify.authenticate, fastify.requireRole('GYM_OWNER', 'ADMIN')],
    handler: gymsController.createMembershipPlan.bind(gymsController),
  });
  fastify.route({ method: 'GET', url: '/:id/membership-plans', handler: gymsController.getMembershipPlans.bind(gymsController) });
  fastify.route({
    method: 'PATCH',
    url: '/:id/membership-plans/:planId',
    preHandler: [fastify.authenticate, fastify.requireRole('GYM_OWNER', 'ADMIN')],
    handler: gymsController.updateMembershipPlan.bind(gymsController),
  });
  fastify.route({
    method: 'DELETE',
    url: '/:id/membership-plans/:planId',
    preHandler: [fastify.authenticate, fastify.requireRole('GYM_OWNER', 'ADMIN')],
    handler: gymsController.deleteMembershipPlan.bind(gymsController),
  });
};
