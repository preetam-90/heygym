import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, registerAndLogin } from './helpers';

let app: FastifyInstance;
beforeAll(async () => { app = await buildTestApp(); });
afterAll(async () => { await app.close(); });

describe('auth', () => {
  it('registers, rejects duplicate email, logins, refreshes, me, logout', async () => {
    const { email, password, tokens } = await registerAndLogin(app, 'USER');
    expect(tokens.accessToken).toBeTruthy();

    const dup = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { name: 'Dup', email, password } });
    expect(dup.statusCode).toBe(409);

    const bad = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password: 'wrongpass123' } });
    expect(bad.statusCode).toBe(401);

    const login = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password } });
    expect(login.statusCode).toBe(200);
    const loginBody = login.json() as { data: { accessToken: string; refreshToken: string } };

    const me = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { authorization: `Bearer ${loginBody.data.accessToken}` } });
    expect(me.statusCode).toBe(200);

    const refresh = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', payload: { refreshToken: loginBody.data.refreshToken } });
    expect(refresh.statusCode).toBe(200);
    const refreshBody = refresh.json() as { data: { refreshToken: string } };

    // Old refresh token must be rotated (rejected)
    const reuse = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', payload: { refreshToken: loginBody.data.refreshToken } });
    expect(reuse.statusCode).toBe(401);

    const logout = await app.inject({ method: 'POST', url: '/api/v1/auth/logout', payload: { refreshToken: refreshBody.data.refreshToken } });
    expect(logout.statusCode).toBe(200);
  });

  it('rejects ADMIN self-registration', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { name: 'Evil', email: `evil_${Date.now()}@example.com`, password: 'Password123!', role: 'ADMIN' } });
    expect(res.statusCode).toBe(400);
  });
});
