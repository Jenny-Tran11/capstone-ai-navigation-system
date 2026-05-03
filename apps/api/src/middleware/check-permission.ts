import type { PermissionType } from '@baseline/types/permission';
import type { NextFunction, Response } from 'express';
import { checkPermissionForUserId } from '../baseblocks/permission/permission-utils';
import type { RequestContext } from '../util/request-context.type';

export interface MiddlewarePermissionCheck {
  type: PermissionType;
  value?: ((req: RequestContext) => string) | string;
}

export const checkPermission =
  (checks: MiddlewarePermissionCheck[]) =>
  async (req: RequestContext, res: Response, next: NextFunction) => {
    for (const check of checks) {
      const hasPermission = await checkPermissionForUserId(
        req.currentUserSub,
        check.type,
        typeof check.value === 'function' ? check.value(req) : check.value,
      );

      if (hasPermission) {
        return next();
      }
    }

    const permissionTypes = checks.map((check) => check.type).join(', ');

    console.error(
      `User does not have permission. UserSub: [${req.currentUserSub}] Permissions: [${permissionTypes}]`,
    );

    return res.status(401).json({ error: 'Unauthorized' });
  };
