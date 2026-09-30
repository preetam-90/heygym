import { FastifyPluginAsync } from 'fastify';
import { GymsController } from '../gyms/gyms.controller';
import { GymsService } from '../gyms/gyms.service';
import { EnquiriesService } from '../enquiries/enquiries.service';
import { EnquiriesController } from '../enquiries/enquiries.controller';

/**
 * Canonical owner API: /api/v1/owner/gyms/*
 * Reuses the same GymsService + ownership checks as /api/v1/gyms/*.
 * /api/v1/gyms/my is kept as a backward-compatible alias.
 */
export const ownerRoutes: FastifyPluginAsync = async (fastify) => {
  const gymsService = new GymsService();
  const gymsController = new GymsController(gymsService);
  const enquiriesService = new EnquiriesService();
  const enquiriesController = new EnquiriesController(enquiriesService);
  const ownerGuard = [fastify.authenticate, fastify.requireRole('GYM_OWNER', 'ADMIN')];

  fastify.route({ method: 'GET', url: '/gyms', preHandler: ownerGuard, handler: gymsController.getMyGyms.bind(gymsController) });
  fastify.route({ method: 'POST', url: '/gyms', preHandler: ownerGuard, handler: gymsController.createGym.bind(gymsController) });
  fastify.route({ method: 'GET', url: '/gyms/:id', preHandler: ownerGuard, handler: gymsController.getGymById.bind(gymsController) });
  fastify.route({ method: 'PATCH', url: '/gyms/:id', preHandler: ownerGuard, handler: gymsController.updateGym.bind(gymsController) });
  fastify.route({ method: 'DELETE', url: '/gyms/:id', preHandler: ownerGuard, handler: gymsController.deleteGym.bind(gymsController) });
  fastify.route({ method: 'POST', url: '/gyms/:id/submit', preHandler: ownerGuard, handler: gymsController.submitGym.bind(gymsController) });

  fastify.route({ method: 'POST', url: '/gyms/:id/facilities', preHandler: ownerGuard, handler: gymsController.addFacility.bind(gymsController) });
  fastify.route({ method: 'DELETE', url: '/gyms/:id/facilities/:facilityId', preHandler: ownerGuard, handler: gymsController.removeFacility.bind(gymsController) });

  fastify.route({ method: 'POST', url: '/gyms/:id/plans', preHandler: ownerGuard, handler: async (req, reply) => {
    const r = req as unknown as { params: { id: string } };
    return gymsController.createMembershipPlan({ ...req, params: r.params } as never, reply);
  } });
  fastify.route({ method: 'PATCH', url: '/gyms/:id/plans/:planId', preHandler: ownerGuard, handler: async (req, reply) => {
    const r = req as unknown as { params: { id: string; planId: string } };
    return gymsController.updateMembershipPlan({ ...req, params: r.params } as never, reply);
  } });
  fastify.route({ method: 'DELETE', url: '/gyms/:id/plans/:planId', preHandler: ownerGuard, handler: async (req, reply) => {
    const r = req as unknown as { params: { id: string; planId: string } };
    return gymsController.deleteMembershipPlan({ ...req, params: r.params } as never, reply);
  } });

  fastify.route({ method: 'POST', url: '/gyms/:id/photos', preHandler: ownerGuard, handler: gymsController.uploadPhoto.bind(gymsController) });
  fastify.route({ method: 'DELETE', url: '/gyms/:id/photos/:photoId', preHandler: ownerGuard, handler: gymsController.deletePhoto.bind(gymsController) });
  fastify.route({ method: 'PATCH', url: '/gyms/:id/photos/:photoId', preHandler: ownerGuard, handler: gymsController.updatePhoto.bind(gymsController) });

  fastify.route({ method: 'PUT', url: '/gyms/:id/hours', preHandler: ownerGuard, handler: gymsController.setHours.bind(gymsController) });

  fastify.route({ method: 'GET', url: '/enquiries', preHandler: ownerGuard, handler: enquiriesController.listOwnerEnquiries.bind(enquiriesController) });
  fastify.route({ method: 'GET', url: '/enquiries/:id', preHandler: ownerGuard, handler: enquiriesController.getOwnerEnquiry.bind(enquiriesController) });
  fastify.route({ method: 'PATCH', url: '/enquiries/:id', preHandler: ownerGuard, handler: enquiriesController.updateOwnerEnquiry.bind(enquiriesController) });
};
