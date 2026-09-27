import { FastifyPluginAsync } from 'fastify';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

export const usersRoutes: FastifyPluginAsync = async (fastify) => {
  const usersService = new UsersService();
  const usersController = new UsersController(usersService);

  fastify.route({
    method: 'GET',
    url: '/me',
    preHandler: fastify.authenticate,
    handler: usersController.getProfile.bind(usersController),
  });

  fastify.route({
    method: 'PATCH',
    url: '/me',
    preHandler: fastify.authenticate,
    handler: usersController.updateProfile.bind(usersController),
  });
};