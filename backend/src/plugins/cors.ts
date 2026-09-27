import { FastifyPluginAsync } from 'fastify';
import { env } from '../config/env';

export const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(import('@fastify/cors'), {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
};