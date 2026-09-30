import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, registerAndLogin } from './helpers';

let app: FastifyInstance;
let userToken = '';

function multipartPayload(field: string, filename: string, mime: string, content: Buffer) {
  const boundary = '----vitestboundary0001';
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${field}"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`,
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  return { payload: Buffer.concat([head, content, tail]), contentType: `multipart/form-data; boundary=${boundary}` };
}

beforeAll(async () => {
  app = await buildTestApp();
  const user = await registerAndLogin(app, 'USER');
  userToken = user.tokens.accessToken;
});
afterAll(async () => {
  await app.close();
});

describe('owner avatar upload', () => {
  test('rejects unauthenticated avatar upload', async () => {
    const { payload, contentType } = multipartPayload('avatar', 'avatar.png', 'image/png', Buffer.from('fake-png-bytes'));
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/users/me/avatar',
      headers: { 'content-type': contentType },
      payload,
    });
    expect(res.statusCode).toBe(401);
  });

  test('rejects non-image upload', async () => {
    const { payload, contentType } = multipartPayload('avatar', 'notes.txt', 'application/octet-stream', Buffer.from('not an image'));
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/users/me/avatar',
      headers: { authorization: `Bearer ${userToken}`, 'content-type': contentType },
      payload,
    });
    expect(res.statusCode).toBe(400);
  });

  test('uploads avatar and returns avatarUrl', async () => {
    const { payload, contentType } = multipartPayload('avatar', 'avatar.png', 'image/png', Buffer.from('fake-png-bytes'));
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/users/me/avatar',
      headers: { authorization: `Bearer ${userToken}`, 'content-type': contentType },
      payload,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { success: boolean; data: { user: { avatarUrl: string | null } } };
    expect(body.success).toBe(true);
    expect(body.data.user.avatarUrl).toContain('/uploads/');
  });

  test('clears avatar via PATCH', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/me',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { avatarUrl: null },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { success: boolean; data: { user: { avatarUrl: string | null } } };
    expect(body.data.user.avatarUrl).toBeNull();
  });
});
