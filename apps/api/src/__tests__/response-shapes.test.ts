/**
 * API response shape contracts
 *
 * Verifies that each authenticated endpoint returns a JSON body whose fields
 * match the TypeScript type declarations — no missing required fields, no
 * undeclared extras leaking through.
 *
 * Covered endpoints:
 *   GET  /user-profile/user/me             → UserProfile (mapped)
 *   PUT  /user-profile/user/me             → UserProfile (mapped)
 *   GET  /user-profile/user/preferences    → Record<string,unknown>
 *   PUT  /user-profile/user/preferences    → merged preferences
 *   GET  /app-config/user/mobile           → MobileRuntimeConfig (all 7 keys)
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

import { userProfileService } from '../baseblocks/user-profile/user-profile.service';
import { appConfigService } from '../baseblocks/app-config/app-config.service';
import { app as profileApp } from '../baseblocks/user-profile/user-profile-api';
import { app as configApp } from '../baseblocks/app-config/app-config-api';

// Build a minimal unsigned JWT: base64url(header).base64url({sub}).""
function makeJwt(sub: string): string {
  const b64 = (s: string) =>
    Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${b64('{"alg":"none"}')}.${b64(JSON.stringify({ sub }))}.`;
}

beforeEach(() => vi.clearAllMocks());

// ── GET /user-profile/user/me ─────────────────────────────────────────────────

describe('GET /user-profile/user/me — response shape', () => {
  const storedProfile = {
    userId: 'u-abc',
    displayName: 'Alice',
    avatarKey: 's3://bucket/avatar.jpg',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-06-01T00:00:00Z',
    preferences: { speechRate: 1.5 }, // must NOT appear in response
    someInternalField: 'hidden',       // must NOT appear in response
  };

  it('returns exactly { userId, displayName, avatarKey, createdAt, updatedAt }', async () => {
    (userProfileService.get as Mock).mockResolvedValue(storedProfile);

    const res = await supertest(profileApp)
      .get('/user-profile/user/me')
      .set('Authorization', `Bearer ${makeJwt('u-abc')}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);

    const body = res.body as Record<string, unknown>;

    // Required field
    expect(body.userId).toBe('u-abc');
    // Optional declared fields present when populated
    expect(body.displayName).toBe('Alice');
    expect(body.avatarKey).toBe('s3://bucket/avatar.jpg');
    expect(body.createdAt).toBe('2025-01-01T00:00:00Z');
    expect(body.updatedAt).toBe('2025-06-01T00:00:00Z');
    // Internal fields must not leak through
    expect(body).not.toHaveProperty('preferences');
    expect(body).not.toHaveProperty('someInternalField');
  });

  it('optional fields are absent (not null) when the profile has no values', async () => {
    (userProfileService.get as Mock).mockResolvedValue({ userId: 'u-bare' });

    const res = await supertest(profileApp)
      .get('/user-profile/user/me')
      .set('Authorization', `Bearer ${makeJwt('u-bare')}`);

    const body = res.body as Record<string, unknown>;
    expect(body.userId).toBe('u-bare');
    // Undefined fields serialise to absent keys in JSON, not null
    expect(body).not.toHaveProperty('displayName');
    expect(body).not.toHaveProperty('avatarKey');
  });
});

// ── PUT /user-profile/user/me ─────────────────────────────────────────────────

describe('PUT /user-profile/user/me — response shape', () => {
  it('returns the same mapped shape after an update', async () => {
    (userProfileService.update as Mock).mockResolvedValue({
      userId: 'u-abc',
      displayName: 'Bob',
      avatarKey: undefined,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-06-15T00:00:00Z',
    });

    const res = await supertest(profileApp)
      .put('/user-profile/user/me')
      .set('Authorization', `Bearer ${makeJwt('u-abc')}`)
      .send({ displayName: 'Bob' });

    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.userId).toBe('u-abc');
    expect(body.displayName).toBe('Bob');
    expect(body).not.toHaveProperty('preferences');
  });
});

// ── GET /user-profile/user/preferences ───────────────────────────────────────

describe('GET /user-profile/user/preferences — response shape', () => {
  it('returns the stored preferences object directly', async () => {
    const prefs = {
      speechRate: 1.0,
      verbosity: 'medium',
      hapticEnabled: true,
      detectionIntervalSec: 10,
      maxScansPerHour: 30,
    };
    (userProfileService.get as Mock).mockResolvedValue({ userId: 'u1', preferences: prefs });

    const res = await supertest(profileApp)
      .get('/user-profile/user/preferences')
      .set('Authorization', `Bearer ${makeJwt('u1')}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(prefs);
  });

  it('returns an object (not array, not null) when preferences are absent', async () => {
    (userProfileService.get as Mock).mockResolvedValue({ userId: 'u2' });

    const res = await supertest(profileApp)
      .get('/user-profile/user/preferences')
      .set('Authorization', `Bearer ${makeJwt('u2')}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeTypeOf('object');
    expect(Array.isArray(res.body)).toBe(false);
    expect(res.body).not.toBeNull();
  });
});

// ── PUT /user-profile/user/preferences ───────────────────────────────────────

describe('PUT /user-profile/user/preferences — response shape', () => {
  it('response body equals the computed merge, not the raw service result', async () => {
    const existing = { speechRate: 1.0, hapticEnabled: true };
    (userProfileService.get as Mock).mockResolvedValue({ userId: 'u1', preferences: existing });
    // update return value is intentionally different — handler returns `merged`, not this
    (userProfileService.update as Mock).mockResolvedValue({ userId: 'u1', preferences: { other: true } });

    const res = await supertest(profileApp)
      .put('/user-profile/user/preferences')
      .set('Authorization', `Bearer ${makeJwt('u1')}`)
      .send({ speechRate: 2.0 });

    expect(res.status).toBe(200);
    // Should reflect the merge, not the update() return value
    expect(res.body.speechRate).toBe(2.0);
    expect(res.body.hapticEnabled).toBe(true);
    expect(res.body).not.toHaveProperty('other');
  });

  it('preferredLocations in the response are trimmed objects with the right keys', async () => {
    (userProfileService.get as Mock).mockResolvedValue({ userId: 'u1', preferences: {} });
    (userProfileService.update as Mock).mockResolvedValue({});

    const res = await supertest(profileApp)
      .put('/user-profile/user/preferences')
      .set('Authorization', `Bearer ${makeJwt('u1')}`)
      .send({
        preferredLocations: [
          { tag: 'home', label: '  My House  ', address: '  1 Main St  ', lat: -33.8, lng: 151.0 },
        ],
      });

    expect(res.status).toBe(200);
    const [loc] = res.body.preferredLocations as Array<Record<string, unknown>>;
    expect(loc).toEqual({ tag: 'home', label: 'My House', address: '1 Main St', lat: -33.8, lng: 151.0 });
    // No extra fields
    expect(Object.keys(loc).sort()).toEqual(['address', 'label', 'lat', 'lng', 'tag']);
  });
});

// ── GET /app-config/user/mobile — MobileRuntimeConfig shape ──────────────────

describe('GET /app-config/user/mobile — response shape', () => {
  const MOBILE_RUNTIME_CONFIG_KEYS = [
    'detectApiBaseUrl',
    'detectApiKey',
    'crossingApiBaseUrl',
    'crossingApiKey',
    'googleMapsApiKey',
    'googleAiApiKey',
    'googleAiModel',
  ];

  it('returns all 7 MobileRuntimeConfig keys as strings', async () => {
    (appConfigService.get as Mock).mockResolvedValue({
      configId: 'mobile',
      mobile: {
        detectApiBaseUrl: 'https://detect.example.com',
        detectApiKey: 'key-1',
        crossingApiBaseUrl: 'https://crossing.example.com',
        crossingApiKey: 'key-2',
        googleMapsApiKey: 'key-3',
        googleAiApiKey: 'key-4',
        googleAiModel: 'gemini-pro',
      },
    });

    const res = await supertest(configApp).get('/app-config/user/mobile');

    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;

    for (const key of MOBILE_RUNTIME_CONFIG_KEYS) {
      expect(body).toHaveProperty(key);
      expect(typeof body[key]).toBe('string');
    }
  });

  it('falls back to empty strings when appConfigService returns no record', async () => {
    (appConfigService.get as Mock).mockResolvedValue(null);

    const res = await supertest(configApp).get('/app-config/user/mobile');

    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;

    for (const key of MOBILE_RUNTIME_CONFIG_KEYS) {
      if (key !== 'googleAiModel') {
        expect(body[key]).toBe('');
      }
    }
    // Hard-coded model default
    expect(body.googleAiModel).toBe('gemini-2.0-flash');
  });

  it('response has no extra keys beyond MobileRuntimeConfig', async () => {
    (appConfigService.get as Mock).mockResolvedValue(null);

    const res = await supertest(configApp).get('/app-config/user/mobile');

    const extraKeys = Object.keys(res.body as object).filter(
      (k) => !MOBILE_RUNTIME_CONFIG_KEYS.includes(k),
    );
    expect(extraKeys).toHaveLength(0);
  });
});
