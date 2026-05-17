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

function makeJwt(sub: string): string {
  const b64url = (s: string) =>
    Buffer.from(s)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  return `${b64url('{"alg":"none"}')}.${b64url(JSON.stringify({ sub }))}.`;
}

const storedProfile = (sub: string, prefs: Record<string, unknown> = {}) => ({
  userId: sub,
  preferences: prefs,
});

beforeEach(() => vi.clearAllMocks());

// ── GET preferences ───────────────────────────────────────────────────────────

describe('GET /user-profile/user/preferences', () => {
  it('returns the stored preferences for an existing user', async () => {
    const prefs = { speechRate: 1.5, hapticEnabled: false, verbosity: 'high' };
    (userProfileService.get as Mock).mockResolvedValue(storedProfile('u1', prefs));

    const res = await supertest(app)
      .get('/user-profile/user/preferences')
      .set('Authorization', `Bearer ${makeJwt('u1')}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(prefs);
  });

  it('returns {} for a user whose profile has no preferences', async () => {
    (userProfileService.get as Mock).mockResolvedValue({ userId: 'u2' });

    const res = await supertest(app)
      .get('/user-profile/user/preferences')
      .set('Authorization', `Bearer ${makeJwt('u2')}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });

  it('auto-creates a profile for a first-time user and returns {}', async () => {
    (userProfileService.get as Mock).mockResolvedValue(null);
    (userProfileService.create as Mock).mockResolvedValue({ userId: 'new' });

    const res = await supertest(app)
      .get('/user-profile/user/preferences')
      .set('Authorization', `Bearer ${makeJwt('new')}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
    expect(userProfileService.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'new' }),
    );
  });

  it('reads the profile using the sub from the JWT, not a hard-coded id', async () => {
    (userProfileService.get as Mock).mockResolvedValue(storedProfile('target-user'));

    await supertest(app)
      .get('/user-profile/user/preferences')
      .set('Authorization', `Bearer ${makeJwt('target-user')}`);

    expect(userProfileService.get).toHaveBeenCalledWith('target-user');
    expect(userProfileService.get).not.toHaveBeenCalledWith('other-user');
  });
});

// ── PUT preferences ───────────────────────────────────────────────────────────

describe('PUT /user-profile/user/preferences', () => {
  it('merges the patch over existing preferences and returns the result', async () => {
    const existing = { speechRate: 1.0, hapticEnabled: true, verbosity: 'medium' };
    (userProfileService.get as Mock).mockResolvedValue(storedProfile('u1', existing));
    (userProfileService.update as Mock).mockResolvedValue({});

    const res = await supertest(app)
      .put('/user-profile/user/preferences')
      .set('Authorization', `Bearer ${makeJwt('u1')}`)
      .send({ speechRate: 2.0 });

    expect(res.status).toBe(200);
    expect(res.body.speechRate).toBe(2.0);
    expect(res.body.hapticEnabled).toBe(true);
    expect(res.body.verbosity).toBe('medium');
  });

  it('persists the merged preferences to the service', async () => {
    (userProfileService.get as Mock).mockResolvedValue(storedProfile('u1', { a: 1 }));
    (userProfileService.update as Mock).mockResolvedValue({});

    await supertest(app)
      .put('/user-profile/user/preferences')
      .set('Authorization', `Bearer ${makeJwt('u1')}`)
      .send({ b: 2 });

    expect(userProfileService.update).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', preferences: { a: 1, b: 2 } }),
    );
  });

  it('normalizes preferredLocations — deduplicates by tag, last entry wins', async () => {
    (userProfileService.get as Mock).mockResolvedValue(storedProfile('u1'));
    (userProfileService.update as Mock).mockResolvedValue({});

    const res = await supertest(app)
      .put('/user-profile/user/preferences')
      .set('Authorization', `Bearer ${makeJwt('u1')}`)
      .send({
        preferredLocations: [
          { tag: 'home', label: 'Old Home', address: '1 Oak St', lat: -33.8, lng: 151.0 },
          { tag: 'home', label: 'New Home', address: '2 Elm Rd', lat: -33.9, lng: 151.1 },
          { tag: 'work', label: 'Office', address: '3 Corp Ave', lat: -33.7, lng: 151.2 },
        ],
      });

    expect(res.status).toBe(200);
    const locs: Array<{ tag: string; label: string }> = res.body.preferredLocations;
    expect(locs).toHaveLength(2);
    expect(locs.find((l) => l.tag === 'home')?.label).toBe('New Home');
    expect(locs.find((l) => l.tag === 'work')?.label).toBe('Office');
  });

  it('strips invalid preferredLocations entries', async () => {
    (userProfileService.get as Mock).mockResolvedValue(storedProfile('u1'));
    (userProfileService.update as Mock).mockResolvedValue({});

    const res = await supertest(app)
      .put('/user-profile/user/preferences')
      .set('Authorization', `Bearer ${makeJwt('u1')}`)
      .send({
        preferredLocations: [
          { tag: 'home', label: 'Valid', address: '1 St', lat: -33.8, lng: 151.0 },
          { tag: 'office', label: 'Bad tag', address: '2 St', lat: -33.8, lng: 151.0 },
          { tag: 'work', label: '', address: '3 St', lat: -33.8, lng: 151.0 },
          { tag: 'other', label: 'No coords', address: '4 St', lat: Number.NaN, lng: 0 },
        ],
      });

    expect(res.status).toBe(200);
    const locs: unknown[] = res.body.preferredLocations;
    expect(locs).toHaveLength(1);
  });

  it('auto-creates a profile for a new user before applying the patch', async () => {
    (userProfileService.get as Mock).mockResolvedValue(null);
    (userProfileService.create as Mock).mockResolvedValue(storedProfile('fresh'));
    (userProfileService.update as Mock).mockResolvedValue({});

    const res = await supertest(app)
      .put('/user-profile/user/preferences')
      .set('Authorization', `Bearer ${makeJwt('fresh')}`)
      .send({ speechRate: 0.8 });

    expect(res.status).toBe(200);
    expect(userProfileService.create).toHaveBeenCalledOnce();
    expect(userProfileService.update).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'fresh', preferences: { speechRate: 0.8 } }),
    );
  });

  it('does not call create when the profile already exists', async () => {
    (userProfileService.get as Mock).mockResolvedValue(storedProfile('u1'));
    (userProfileService.update as Mock).mockResolvedValue({});

    await supertest(app)
      .put('/user-profile/user/preferences')
      .set('Authorization', `Bearer ${makeJwt('u1')}`)
      .send({ hapticEnabled: false });

    expect(userProfileService.create).not.toHaveBeenCalled();
  });

  it('successive patches accumulate without overwriting unrelated keys', async () => {
    const existing = { speechRate: 1.0, hapticEnabled: true };
    (userProfileService.get as Mock)
      .mockResolvedValueOnce(storedProfile('u1', existing))
      .mockResolvedValueOnce(storedProfile('u1', { ...existing, speechRate: 1.5 }));
    (userProfileService.update as Mock).mockResolvedValue({});

    await supertest(app)
      .put('/user-profile/user/preferences')
      .set('Authorization', `Bearer ${makeJwt('u1')}`)
      .send({ speechRate: 1.5 });

    const res2 = await supertest(app)
      .put('/user-profile/user/preferences')
      .set('Authorization', `Bearer ${makeJwt('u1')}`)
      .send({ verbosity: 'low' });

    expect(res2.body.speechRate).toBe(1.5);
    expect(res2.body.hapticEnabled).toBe(true);
    expect(res2.body.verbosity).toBe('low');
  });
});
