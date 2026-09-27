import { FastifyPluginAsync } from 'fastify';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify as any);
  const authController = new AuthController(authService);

  fastify.route({
    method: 'POST',
    url: '/register',
    handler: authController.register.bind(authController),
  });

  fastify.route({
    method: 'POST',
    url: '/login',
    handler: authController.login.bind(authController),
  });

  fastify.route({
    method: 'POST',
    url: '/logout',
    handler: authController.logout.bind(authController),
  });

  fastify.route({
    method: 'GET',
    url: '/me',
    preHandler: fastify.authenticate,
    handler: authController.me.bind(authController),
  });

  fastify.route({
    method: 'POST',
    url: '/refresh',
    handler: authController.refresh.bind(authController),
  });
};