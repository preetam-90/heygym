import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../config/env';

// NOTE: wrapped in fastify-plugin (no encapsulation) on purpose.
// The CORS hook must run for routes registered on the root instance.
// If this plugin were encapsulated, only the preflight OPTIONS route would
// answer with CORS headers while actual responses (e.g. POST /auth/login)
// would miss `Access-Control-Allow-Origin` — and browsers would block
// every auth request with a CORS error.
export const corsPlugin: FastifyPluginAsync = fp(async (fastify) => {
  await fastify.register(import('@fastify/cors'), {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
});
