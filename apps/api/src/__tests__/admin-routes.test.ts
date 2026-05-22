import supertest from 'supertest';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the permission check and all DynamoDB-backed services before any import
// resolves, so none of the route handlers can reach real AWS.
vi.mock('../baseblocks/permission/permission-utils', () => ({
  checkPermissionForUserId: vi.fn(),
  getPermissionsForOwnerId: vi.fn(),
}));

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
  permissionService: {
    getAll: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../baseblocks/cognito/cognito.service', () => ({
  createUser: vi.fn(),
  getUserAttributesByEmail: vi.fn(),
}));

import { checkPermissionForUserId } from '../baseblocks/permission/permission-utils';
import { app } from '../baseblocks/user-profile/user-profile-api';

beforeEach(() => vi.clearAllMocks());

// ── Admin-only routes reject non-SUPER users ──────────────────────────────────

describe('admin route protection — no SUPER permission', () => {
  beforeEach(() => {
    (checkPermissionForUserId as Mock).mockResolvedValue(false);
  });

  it('GET /user-profile/admin/list returns 401', async () => {
    const res = await supertest(app).get('/user-profile/admin/list');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  it('GET /user-profile/admin/:userId returns 401', async () => {
    const res = await supertest(app).get('/user-profile/admin/user-123');
    expect(res.status).toBe(401);
  });

  it('POST /user-profile/admin/invite returns 401', async () => {
    const res = await supertest(app)
      .post('/user-profile/admin/invite')
      .send({ email: 'test@example.com' });
    expect(res.status).toBe(401);
  });

  it('DELETE /user-profile/admin/:userId returns 401', async () => {
    const res = await supertest(app).delete('/user-profile/admin/user-123');
    expect(res.status).toBe(401);
  });
});

// ── SUPER users are let through to the handler ────────────────────────────────

describe('admin route protection — with SUPER permission', () => {
  beforeEach(() => {
    (checkPermissionForUserId as Mock).mockResolvedValue(true);
  });

  it('GET /user-profile/admin/list is not 401 when SUPER permission granted', async () => {
    const { userProfileService } = await import(
      '../baseblocks/user-profile/user-profile.service'
    );
    const { permissionService } = await import(
      '../baseblocks/permission/permission.service'
    );
    (userProfileService.getAll as Mock).mockResolvedValue([]);
    (permissionService.getAll as Mock).mockResolvedValue([]);

    const res = await supertest(app).get('/user-profile/admin/list');
    expect(res.status).not.toBe(401);
  });
});
