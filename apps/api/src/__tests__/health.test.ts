import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import createApp from '../util/express-app';

const app = createApp();

describe('GET /health', () => {
  it('responds 200 with { status: "ok" }', async () => {
    const res = await supertest(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns JSON content-type', async () => {
    const res = await supertest(app).get('/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

describe('unknown routes', () => {
  it('returns 404 for unregistered paths', async () => {
    const res = await supertest(app).get('/not-a-real-route');
    expect(res.status).toBe(404);
  });
});
