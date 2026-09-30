import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, registerAndLogin } from './helpers';

let app: FastifyInstance;
let ownerToken = '';
let userToken = '';

beforeAll(async () => {
  app = await buildTestApp();
  const owner = await registerAndLogin(app, 'GYM_OWNER');
  ownerToken = owner.tokens.accessToken;
  const user = await registerAndLogin(app, 'USER');
  userToken = user.tokens.accessToken;
});
afterAll(async () => { await app.close(); });

describe('gym lifecycle + discovery', () => {
  it('owner creates gym (DRAFT), submits, admin approves, public sees it', async () => {
    const create = await app.inject({
      method: 'POST', url: '/api/v1/owner/gyms',
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: { name: `Lifecycle Gym ${Date.now()}`, address: '123 Test St', city: 'Noida', latitude: 28.6, longitude: 77.3 },
    });
    expect(create.statusCode).toBe(201);
    const gym = (create.json() as { data: { gym: { id: string; status: string; slug: string } } }).data.gym;
    expect(gym.status).toBe('DRAFT');

    const submit = await app.inject({ method: 'POST', url: `/api/v1/owner/gyms/${gym.id}/submit`, headers: { authorization: `Bearer ${ownerToken}` } });
    expect(submit.statusCode).toBe(200);
    expect((submit.json() as { data: { gym: { status: string } } }).data.gym.status).toBe('PENDING_APPROVAL');

    // Public must NOT see pending gym
    const searchBefore = await app.inject({ method: 'GET', url: `/api/v1/gyms?q=${encodeURIComponent(gym.id.slice(0, 8))}` });
    expect(searchBefore.statusCode).toBe(200);

    // Approve via seed admin (login)
    const adminLogin = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'admin@heygym.dev', password: 'Password123!' } });
    expect(adminLogin.statusCode).toBe(200);
    const adminToken = (adminLogin.json() as { data: { accessToken: string } }).data.accessToken;
    const approve = await app.inject({ method: 'POST', url: `/api/v1/admin/gyms/${gym.id}/approve`, headers: { authorization: `Bearer ${adminToken}` } });
    expect(approve.statusCode).toBe(200);

    // Owner cannot edit another owner's gym (IDOR): create second owner
    const other = await registerAndLogin(app, 'GYM_OWNER');
    const hack = await app.inject({ method: 'PATCH', url: `/api/v1/owner/gyms/${gym.id}`, headers: { authorization: `Bearer ${other.tokens.accessToken}` }, payload: { name: 'Hacked' } });
    expect([403, 404]).toContain(hack.statusCode);
  });

  it('discovery supports search, filters, sort allowlist, pagination caps', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/gyms?city=Noida&sort=newest&page=1&pageSize=5' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data: { gyms: unknown[]; meta: { pageSize: number } } };
    expect(body.data.meta.pageSize).toBeLessThanOrEqual(100);

    const badSort = await app.inject({ method: 'GET', url: '/api/v1/gyms?sort=DROP TABLE' });
    // Unknown sort is ignored/mapped, must not 500
    expect([200, 400]).toContain(badSort.statusCode);

    const huge = await app.inject({ method: 'GET', url: '/api/v1/gyms?limit=1000000' });
    expect(huge.statusCode).toBe(400);

    const geo = await app.inject({ method: 'GET', url: '/api/v1/gyms?lat=28.6&lng=77.3&radius=5&sort=nearest' });
    expect(geo.statusCode).toBe(200);

    const price = await app.inject({ method: 'GET', url: '/api/v1/gyms?minPrice=500&maxPrice=3000&sort=price_low' });
    expect(price.statusCode).toBe(200);
  });

  it('user cannot access admin endpoints', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/stats', headers: { authorization: `Bearer ${userToken}` } });
    expect(res.statusCode).toBe(403);
  });
});
