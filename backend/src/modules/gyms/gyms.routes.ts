import { FastifyPluginAsync } from 'fastify';
import { GymsController } from './gyms.controller';
import { GymsService } from './gyms.service';

export const gymsRoutes: FastifyPluginAsync = async (fastify) => {
  const gymsService = new GymsService();
  const gymsController = new GymsController(gymsService);

  fastify.route({
    method: 'GET',
    url: '/',
    handler: gymsController.getApprovedGyms.bind(gymsController),
  });

  fastify.route({
    method: 'GET',
    url: '/my',
    preHandler: fastify.authenticate,
    handler: gymsController.getMyGyms.bind(gymsController),
  });

  fastify.route({
    method: 'GET',
    url: '/:id',
    handler: gymsController.getGymById.bind(gymsController),
  });

  fastify.route({
    method: 'POST',
    url: '/',
    preHandler: fastify.authenticate,
    handler: gymsController.createGym.bind(gymsController),
  });

  fastify.route({
    method: 'PATCH',
    url: '/:id',
    preHandler: fastify.authenticate,
    handler: gymsController.updateGym.bind(gymsController),
  });

  fastify.route({
    method: 'POST',
    url: '/:id/membership-plans',
    preHandler: fastify.authenticate,
    handler: gymsController.createMembershipPlan.bind(gymsController),
  });

  fastify.route({
    method: 'GET',
    url: '/:id/membership-plans',
    handler: gymsController.getMembershipPlans.bind(gymsController),
  });

  fastify.route({
    method: 'PATCH',
    url: '/:id/membership-plans/:planId',
    preHandler: fastify.authenticate,
    handler: gymsController.updateMembershipPlan.bind(gymsController),
  });
};