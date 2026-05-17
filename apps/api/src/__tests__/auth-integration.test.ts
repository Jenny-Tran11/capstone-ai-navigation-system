import supertest from 'supertest';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';

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

import { userProfileService } from '../baseblocks/user-profile/user-profile.service';
import { app } from '../baseblocks/user-profile/user-profile-api';

// Build a minimal unsigned JWT whose payload carries the given sub.
function makeJwt(sub: string): string {
  const b64url = (s: string) =>
    Buffer.from(s)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  return `${b64url('{"alg":"none"}')}.${b64url(JSON.stringify({ sub }))}.`;
}

const profile = (sub: string) => ({ userId: sub, displayName: '', createdAt: '', updatedAt: '' });

beforeEach(() => vi.clearAllMocks());

// ── JWT Bearer extraction ─────────────────────────────────────────────────────

describe('Bearer JWT → currentUserSub', () => {
  it('routes the request under the sub encoded in the JWT', async () => {
    (userProfileService.get as Mock).mockResolvedValue(profile('alice'));

    const res = await supertest(app)
      .get('/user-profile/user/me')
      .set('Authorization', `Bearer ${makeJwt('alice')}`);

    expect(userProfileService.get).toHaveBeenCalledWith('alice');
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('alice');
  });

  it('uses an empty sub when no Authorization header is present', async () => {
    (userProfileService.get as Mock).mockResolvedValue(null);
    (userProfileService.create as Mock).mockResolvedValue(profile(''));

    await supertest(app).get('/user-profile/user/me');

    expect(userProfileService.get).toHaveBeenCalledWith('');
  });

  it('uses an empty sub when the Authorization scheme is not Bearer', async () => {
    (userProfileService.get as Mock).mockResolvedValue(null);
    (userProfileService.create as Mock).mockResolvedValue(profile(''));

    await supertest(app)
      .get('/user-profile/user/me')
      .set('Authorization', 'Basic dXNlcjpwYXNz');

    expect(userProfileService.get).toHaveBeenCalledWith('');
  });

  it('uses an empty sub when the Bearer value is not a valid JWT', async () => {
    (userProfileService.get as Mock).mockResolvedValue(null);
    (userProfileService.create as Mock).mockResolvedValue(profile(''));

    await supertest(app)
      .get('/user-profile/user/me')
      .set('Authorization', 'Bearer not-a-jwt');

    expect(userProfileService.get).toHaveBeenCalledWith('');
  });

  it('uses an empty sub when the JWT payload has no sub field', async () => {
    const b64url = (s: string) =>
      Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const noSubJwt = `${b64url('{"alg":"none"}')}.${b64url('{"email":"anon@example.com"}')}.`;

    (userProfileService.get as Mock).mockResolvedValue(null);
    (userProfileService.create as Mock).mockResolvedValue(profile(''));

    await supertest(app)
      .get('/user-profile/user/me')
      .set('Authorization', `Bearer ${noSubJwt}`);

    expect(userProfileService.get).toHaveBeenCalledWith('');
  });
});

// ── Authenticated endpoint returns correct user data ──────────────────────────

describe('GET /user-profile/user/me — authenticated', () => {
  it('returns the profile for the authenticated user', async () => {
    (userProfileService.get as Mock).mockResolvedValue({
      ...profile('bob'),
      displayName: 'Bob Builder',
    });

    const res = await supertest(app)
      .get('/user-profile/user/me')
      .set('Authorization', `Bearer ${makeJwt('bob')}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('bob');
    expect(res.body.displayName).toBe('Bob Builder');
  });

  it('auto-creates and returns a profile for a first-time user', async () => {
    (userProfileService.get as Mock).mockResolvedValue(null);
    (userProfileService.create as Mock).mockResolvedValue(profile('carol'));

    const res = await supertest(app)
      .get('/user-profile/user/me')
      .set('Authorization', `Bearer ${makeJwt('carol')}`);

    expect(res.status).toBe(200);
    expect(userProfileService.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'carol' }),
    );
  });

  it('does not expose internal fields beyond the profile mapper', async () => {
    (userProfileService.get as Mock).mockResolvedValue({
      ...profile('dave'),
      preferences: { secret: true },
      someInternalField: 'hidden',
    });

    const res = await supertest(app)
      .get('/user-profile/user/me')
      .set('Authorization', `Bearer ${makeJwt('dave')}`);

    expect(res.body).not.toHaveProperty('preferences');
    expect(res.body).not.toHaveProperty('someInternalField');
  });
});
