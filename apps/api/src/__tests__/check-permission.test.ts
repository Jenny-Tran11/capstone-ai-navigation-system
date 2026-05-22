import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Response } from 'express';
import type { RequestContext } from '../util/request-context.type';

vi.mock('../baseblocks/permission/permission-utils', () => ({
  checkPermissionForUserId: vi.fn(),
  getPermissionsForOwnerId: vi.fn(),
}));

import { checkPermissionForUserId } from '../baseblocks/permission/permission-utils';
import { checkPermission } from '../middleware/check-permission';

function makeReq(sub = 'user-sub-123'): RequestContext {
  return { currentUserSub: sub } as RequestContext;
}

function makeRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

beforeEach(() => vi.clearAllMocks());

// ── No permission → 401 ───────────────────────────────────────────────────────

describe('checkPermission — unauthorised', () => {
  it('returns 401 when user has no matching permission', async () => {
    (checkPermissionForUserId as Mock).mockResolvedValue(false);
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    await checkPermission([{ type: 'SUPER' }])(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('checks all entries before rejecting', async () => {
    (checkPermissionForUserId as Mock).mockResolvedValue(false);
    const next = vi.fn() as NextFunction;

    await checkPermission([{ type: 'SUPER' }, { type: 'WORKSPACE', value: 'ws_1' }])(
      makeReq(),
      makeRes(),
      next,
    );

    expect(checkPermissionForUserId).toHaveBeenCalledTimes(2);
    expect(next).not.toHaveBeenCalled();
  });
});

// ── Has permission → next() ───────────────────────────────────────────────────

describe('checkPermission — authorised', () => {
  it('calls next() when the user has the required permission', async () => {
    (checkPermissionForUserId as Mock).mockResolvedValue(true);
    const next = vi.fn() as NextFunction;

    await checkPermission([{ type: 'SUPER' }])(makeReq(), makeRes(), next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('short-circuits on the first passing check', async () => {
    (checkPermissionForUserId as Mock)
      .mockResolvedValueOnce(false) // SUPER fails
      .mockResolvedValueOnce(true); // WORKSPACE passes
    const next = vi.fn() as NextFunction;

    await checkPermission([
      { type: 'SUPER' },
      { type: 'WORKSPACE', value: 'ws_abc' },
    ])(makeReq(), makeRes(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(checkPermissionForUserId).toHaveBeenCalledTimes(2);
  });

  it('resolves a function-form value against the request', async () => {
    (checkPermissionForUserId as Mock).mockResolvedValue(true);
    const next = vi.fn() as NextFunction;
    const req = makeReq('user-abc');

    await checkPermission([
      { type: 'WORKSPACE', value: (r) => `ws_${r.currentUserSub}` },
    ])(req, makeRes(), next);

    expect(checkPermissionForUserId).toHaveBeenCalledWith(
      'user-abc',
      'WORKSPACE',
      'ws_user-abc',
    );
    expect(next).toHaveBeenCalledOnce();
  });
});
