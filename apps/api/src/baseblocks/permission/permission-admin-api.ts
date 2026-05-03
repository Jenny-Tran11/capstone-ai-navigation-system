import type { Permission, PermissionType } from '@baseline/types/permission';
import { type Response, Router } from 'express';
import { checkPermission } from '../../middleware/check-permission';
import { getErrorMessage } from '../../util/error-message';
import type { RequestContext } from '../../util/request-context.type';
import { permissionMapper } from './permission';
import {
  getPermissionsForOwnerId,
  getPermissionsForType,
  permissionService,
} from './permission.service';
import { createPermission } from './permission-utils';

export const adminPermissionRouter = Router();

adminPermissionRouter.post('/', [
  checkPermission([{ type: 'SUPER' }]),
  async (req: RequestContext, res: Response) => {
    try {
      const permission = await createPermission(req.body as Permission);
      res.json(permissionMapper(permission));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to create permission ${message}`);
      res.status(400).json({ error: 'Failed to create permission' });
    }
  },
]);

adminPermissionRouter.delete('/:permissionId', [
  checkPermission([{ type: 'SUPER' }]),
  async (req: RequestContext, res: Response) => {
    try {
      const permissionId = req.params.permissionId;
      const isDeleted = await permissionService.delete(permissionId);
      res.status(200);
      res.send(isDeleted);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to delete permission: ${message}`);
      res.status(400).json({ error: 'Failed to delete permission' });
    }
  },
]);

adminPermissionRouter.get('/owner/:ownerId', [
  checkPermission([{ type: 'SUPER' }]),
  async (req: RequestContext, res: Response) => {
    try {
      const permissions = await getPermissionsForOwnerId(req.params.ownerId);
      res.json(permissions.map(permissionMapper));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to get permissions for ownerId: ${message}`);
      res.status(400).json({ error: 'Failed to get permissions for ownerId' });
    }
  },
]);

adminPermissionRouter.get('/list/:type', [
  checkPermission([{ type: 'SUPER' }]),
  async (req: RequestContext, res: Response) => {
    try {
      const { type } = req.params as { type: PermissionType };
      const permissions = await getPermissionsForType(type);
      res.json(permissions.map(permissionMapper));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to get permissions for type: ${message}`);
      res.status(400).json({ error: 'Failed to get permissions for type' });
    }
  },
]);

adminPermissionRouter.get('/list', [
  async (req: RequestContext, res: Response) => {
    try {
      const permissions = await getPermissionsForOwnerId(req.currentUserSub);
      res.json(permissions.map(permissionMapper));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to get permissions for current user: ${message}`);
      res
        .status(400)
        .json({ error: 'Failed to get permissions for current user' });
    }
  },
]);
