import { type Response, Router } from 'express';
import { checkPermission } from '../../middleware/check-permission';
import { getErrorMessage } from '../../util/error-message';
import type { RequestContext } from '../../util/request-context.type';
import { detectionMapper } from './detection';
import { detectionService } from './detection.service';

export const adminDetectionRouter = Router();

adminDetectionRouter.get('/list', [
  checkPermission([{ type: 'SUPER' }]),
  async (_req: RequestContext, res: Response) => {
    try {
      const detections = await detectionService.getAll();
      res.json(detections.map(detectionMapper));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to list detections: ${message}`);
      res.status(400).json({ error: 'Failed to list detections' });
    }
  },
]);

adminDetectionRouter.get('/:detectionId', [
  checkPermission([{ type: 'SUPER' }]),
  async (req: RequestContext, res: Response) => {
    try {
      const detection = await detectionService.get(req.params.detectionId);
      res.json(detectionMapper(detection));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to get detection: ${message}`);
      res.status(400).json({ error: 'Failed to get detection' });
    }
  },
]);

adminDetectionRouter.delete('/:detectionId', [
  checkPermission([{ type: 'SUPER' }]),
  async (req: RequestContext, res: Response) => {
    try {
      const ok = await detectionService.delete(req.params.detectionId);
      res.status(200).send(ok);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to delete detection: ${message}`);
      res.status(400).json({ error: 'Failed to delete detection' });
    }
  },
]);
