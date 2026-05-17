/**
 * Admin model-health check — POST /app-config/admin/mobile/health
 *
 * Covered scenarios:
 *   - No SUPER permission → 401 Unauthorized
 *   - SUPER granted, detectApiBaseUrl empty → 400 "Detect API URL is not configured."
 *   - SUPER granted, valid URL, upstream 200 → JSON proxied through
 *   - SUPER granted, valid URL, upstream non-ok → 400 "Could not reach model health endpoint."
 *   - SUPER granted, fetch throws network error → 400 "Could not reach model health endpoint."
 *   - Trailing slash is stripped before appending /health
 */

import supertest from 'supertest';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Prevent DynamoDB from initialising at import time ─────────────────────────

vi.mock('../baseblocks/user-profile/user-profile.service', () => ({
  userProfileService: {
    get: vi.fn(),
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../baseblocks/permission/permission.service', () => ({
  permissionService: { getAll: vi.fn(), create: vi.fn(), delete: vi.fn() },
}));

vi.mock('../baseblocks/permission/permission-utils', () => ({
  checkPermissionForUserId: vi.fn(),
  getPermissionsForOwnerId: vi.fn(),
}));

vi.mock('../baseblocks/cognito/cognito.service', () => ({
  createUser: vi.fn(),
  getUserAttributesByEmail: vi.fn(),
}));

vi.mock('../baseblocks/app-config/app-config.service', () => ({
  appConfigService: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  MOBILE_CONFIG_ID: 'mobile',
}));

import { checkPermissionForUserId } from '../baseblocks/permission/permission-utils';
import { appConfigService } from '../baseblocks/app-config/app-config.service';
import { app } from '../baseblocks/app-config/app-config-api';

// Build a minimal unsigned JWT: base64url(header).base64url({sub}).""
function makeJwt(sub: string): string {
  const b64 = (s: string) =>
    Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${b64('{"alg":"none"}')}.${b64(JSON.stringify({ sub }))}.`;
}

const SUPER_USER = 'admin-user-1';

beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

// ── Authorization ─────────────────────────────────────────────────────────────

describe('POST /app-config/admin/mobile/health — authorization', () => {
  it('returns 401 when the caller does not have SUPER permission', async () => {
    (checkPermissionForUserId as Mock).mockResolvedValue(false);

    const res = await supertest(app)
      .post('/app-config/admin/mobile/health')
      .set('Authorization', `Bearer ${makeJwt('regular-user')}`);

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: 'Unauthorized' });
  });
});

// ── Configuration guard ───────────────────────────────────────────────────────

describe('POST /app-config/admin/mobile/health — URL not configured', () => {
  it('returns 400 when detectApiBaseUrl is empty', async () => {
    (checkPermissionForUserId as Mock).mockResolvedValue(true);
    (appConfigService.get as Mock).mockResolvedValue({
      configId: 'mobile',
      mobile: {
        detectApiBaseUrl: '',
        detectApiKey: '',
        crossingApiBaseUrl: '',
        crossingApiKey: '',
        googleMapsApiKey: '',
        googleAiApiKey: '',
        googleAiModel: 'gemini-2.0-flash',
      },
    });

    const res = await supertest(app)
      .post('/app-config/admin/mobile/health')
      .set('Authorization', `Bearer ${makeJwt(SUPER_USER)}`);

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: 'Detect API URL is not configured.' });
  });

  it('returns 400 when appConfigService returns null (no stored config)', async () => {
    (checkPermissionForUserId as Mock).mockResolvedValue(true);
    (appConfigService.get as Mock).mockResolvedValue(null);

    const res = await supertest(app)
      .post('/app-config/admin/mobile/health')
      .set('Authorization', `Bearer ${makeJwt(SUPER_USER)}`);

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: 'Detect API URL is not configured.' });
  });
});

// ── Upstream health check ─────────────────────────────────────────────────────

describe('POST /app-config/admin/mobile/health — upstream fetch', () => {
  function mockConfigWithUrl(detectApiBaseUrl: string) {
    (appConfigService.get as Mock).mockResolvedValue({
      configId: 'mobile',
      mobile: {
        detectApiBaseUrl,
        detectApiKey: 'key-1',
        crossingApiBaseUrl: '',
        crossingApiKey: '',
        googleMapsApiKey: '',
        googleAiApiKey: '',
        googleAiModel: 'gemini-2.0-flash',
      },
    });
  }

  it('proxies the upstream JSON when the health check returns 200', async () => {
    (checkPermissionForUserId as Mock).mockResolvedValue(true);
    mockConfigWithUrl('https://detect.example.com');

    const upstreamBody = { status: 'ok', version: '1.2.3' };
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(upstreamBody), { status: 200 }),
    );

    const res = await supertest(app)
      .post('/app-config/admin/mobile/health')
      .set('Authorization', `Bearer ${makeJwt(SUPER_USER)}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(upstreamBody);
  });

  it('returns 400 when the upstream returns a non-ok status', async () => {
    (checkPermissionForUserId as Mock).mockResolvedValue(true);
    mockConfigWithUrl('https://detect.example.com');

    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('Service Unavailable', { status: 503 }),
    );

    const res = await supertest(app)
      .post('/app-config/admin/mobile/health')
      .set('Authorization', `Bearer ${makeJwt(SUPER_USER)}`);

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: 'Could not reach model health endpoint.' });
  });

  it('returns 400 when fetch throws a network error', async () => {
    (checkPermissionForUserId as Mock).mockResolvedValue(true);
    mockConfigWithUrl('https://detect.example.com');

    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));

    const res = await supertest(app)
      .post('/app-config/admin/mobile/health')
      .set('Authorization', `Bearer ${makeJwt(SUPER_USER)}`);

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: 'Could not reach model health endpoint.' });
  });

  it('strips a trailing slash from the base URL before appending /health', async () => {
    (checkPermissionForUserId as Mock).mockResolvedValue(true);
    mockConfigWithUrl('https://detect.example.com/');

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), { status: 200 }),
    );

    await supertest(app)
      .post('/app-config/admin/mobile/health')
      .set('Authorization', `Bearer ${makeJwt(SUPER_USER)}`);

    expect(fetchSpy).toHaveBeenCalledWith('https://detect.example.com/health');
  });

  it('calls the correct /health path on the configured base URL', async () => {
    (checkPermissionForUserId as Mock).mockResolvedValue(true);
    mockConfigWithUrl('https://api.mymodel.io/v1');

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    await supertest(app)
      .post('/app-config/admin/mobile/health')
      .set('Authorization', `Bearer ${makeJwt(SUPER_USER)}`);

    expect(fetchSpy).toHaveBeenCalledWith('https://api.mymodel.io/v1/health');
  });
});
