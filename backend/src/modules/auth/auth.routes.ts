import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { validate } from '../../lib/validate';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema';

const bodyOf = (schema: z.ZodTypeAny): z.ZodTypeAny =>
  (schema as unknown as { shape: { body: z.ZodTypeAny } }).shape.body;

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify as any);
  const authController = new AuthController(authService);

  fastify.route({
    method: 'POST',
    url: '/register',
    preHandler: validate(bodyOf(registerSchema)),
    handler: authController.register.bind(authController),
  });

  fastify.route({
    method: 'POST',
    url: '/login',
    preHandler: validate(bodyOf(loginSchema)),
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
    preHandler: validate(bodyOf(refreshSchema)),
    handler: authController.refresh.bind(authController),
  });

  fastify.route({
    method: 'POST',
    url: '/forgot-password',
    preHandler: validate(bodyOf(forgotPasswordSchema)),
    handler: authController.forgotPassword.bind(authController),
  });

  fastify.route({
    method: 'POST',
    url: '/reset-password',
    preHandler: validate(bodyOf(resetPasswordSchema)),
    handler: authController.resetPassword.bind(authController),
  });
};
