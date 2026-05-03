import { Router, type Response } from 'express';
import { type Workspace } from '@baseline/types/workspace';
import { getErrorMessage } from '../../util/error-message';
import { createPermission } from '../permission/permission-utils';
import { getPermissionsByOwnerIdAndCompositeKey } from '../permission/permission.service';
import { workspaceMapper } from './workspace';
import { workspaceService } from './workspace.service';
import { RequestContext } from '../../util/request-context.type';

export const userWorkspaceRouter = Router();

userWorkspaceRouter.post('/', [
  async (req: RequestContext, res: Response) => {
    try {
      const body = req.body as Partial<Pick<Workspace, 'name' | 'description' | 'imageUrl'>>;
      const workspaceData: Partial<Workspace> = {
        name: body.name,
        description: body.description,
        imageUrl: body.imageUrl,
      };

      const workspace = await workspaceService.create(workspaceData);

      await createPermission({
        type: 'WORKSPACE',
        value: workspace.workspaceId,
        ownerId: req.currentUserSub,
      });

      res.json(workspaceMapper(workspace));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to create workspace: ${message}`);
      res.status(400).json({ error: 'Failed to create workspace' });
    }
  },
]);

userWorkspaceRouter.get('/list', [
  async (req: RequestContext, res: Response) => {
    try {
      const permissions = await getPermissionsByOwnerIdAndCompositeKey(
        req.currentUserSub,
        'WORKSPACE|',
      );

      const workspaceIds = permissions
        .filter((p) => p.type === 'WORKSPACE' && p.value)
        .map((p) => p.value as string);

      if (workspaceIds.length === 0) {
        res.json([]);
        return;
      }

      const workspaces = await workspaceService.batchGet(workspaceIds);
      res.json(workspaces.map(workspaceMapper));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to list workspaces: ${message}`);
      res.status(400).json({ error: 'Failed to list workspaces' });
    }
  },
]);

userWorkspaceRouter.get('/:workspaceId', [
  async (req: RequestContext, res: Response) => {
    try {
      const workspace = await workspaceService.get(req.params.workspaceId);
      res.json(workspaceMapper(workspace));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to get workspace: ${message}`);
      res.status(400).json({ error: 'Failed to get workspace' });
    }
  },
]);
