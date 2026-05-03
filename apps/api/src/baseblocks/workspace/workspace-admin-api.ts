import type { Workspace } from '@baseline/types/workspace';
import { type Response, Router } from 'express';
import { checkPermission } from '../../middleware/check-permission';
import { getErrorMessage } from '../../util/error-message';
import type { RequestContext } from '../../util/request-context.type';
import { workspaceMapper } from './workspace';
import { workspaceService } from './workspace.service';

export const adminWorkspaceRouter = Router();

adminWorkspaceRouter.post('/', [
  checkPermission([{ type: 'SUPER' }]),
  async (req: RequestContext, res: Response) => {
    try {
      const body = req.body as Partial<
        Pick<Workspace, 'name' | 'description' | 'imageUrl'>
      >;
      const workspaceData: Partial<Workspace> = {
        name: body.name,
        description: body.description,
        imageUrl: body.imageUrl,
      };
      const workspace = await workspaceService.create(workspaceData);
      res.json(workspaceMapper(workspace));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to create workspace: ${message}`);
      res.status(400).json({ error: 'Failed to create workspace' });
    }
  },
]);

adminWorkspaceRouter.patch('/', [
  checkPermission([{ type: 'SUPER' }]),
  async (req: RequestContext, res: Response) => {
    try {
      const body = req.body as Partial<
        Pick<Workspace, 'workspaceId' | 'name' | 'description' | 'imageUrl'>
      >;
      const workspaceData: Partial<Workspace> = {
        workspaceId: body.workspaceId,
        name: body.name,
        description: body.description,
        imageUrl: body.imageUrl,
      };
      const workspace = await workspaceService.update(workspaceData);
      res.json(workspaceMapper(workspace));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to update workspace: ${message}`);
      res.status(400).json({ error: 'Failed to update workspace' });
    }
  },
]);

adminWorkspaceRouter.get('/list', [
  checkPermission([{ type: 'SUPER' }]),
  async (_req: RequestContext, res: Response) => {
    try {
      const workspaces = await workspaceService.getAll();
      res.json(workspaces.map(workspaceMapper));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to list workspaces: ${message}`);
      res.status(400).json({ error: 'Failed to list workspaces' });
    }
  },
]);

adminWorkspaceRouter.get('/:workspaceId', [
  checkPermission([{ type: 'SUPER' }]),
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

adminWorkspaceRouter.delete('/:workspaceId', [
  checkPermission([{ type: 'SUPER' }]),
  async (req: RequestContext, res: Response) => {
    try {
      const isDeleted = await workspaceService.delete(req.params.workspaceId);
      res.status(200);
      res.send(isDeleted);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to delete workspace: ${message}`);
      res.status(400).json({ error: 'Failed to delete workspace' });
    }
  },
]);
