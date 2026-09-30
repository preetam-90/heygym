import 'dotenv/config';
import { FastifyInstance } from 'fastify';
import { createApp } from '../src/app';

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = await createApp();
  await app.ready();
  return app;
}

export function randEmail(prefix = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
}

export async function registerAndLogin(app: FastifyInstance, role: 'USER' | 'GYM_OWNER' | 'ADMIN' = 'USER') {
  const email = randEmail(role.toLowerCase());
  const password = 'Password123!';
  const reg = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { name: `${role} Test`, email, password, role: role === 'ADMIN' ? 'USER' : role } });
  const body = reg.json() as { data: { accessToken: string; refreshToken: string; user: { id: string } } };
  return { email, password, tokens: body.data, userId: body.data?.user?.id };
}
