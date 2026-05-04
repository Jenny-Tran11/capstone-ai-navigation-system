import type { Detection, DetectionResult } from '@baseline/types/detection';
import { type Response, Router } from 'express';
import { getErrorMessage } from '../../util/error-message';
import type { RequestContext } from '../../util/request-context.type';
import { detectionMapper } from './detection';
import { detectionService } from './detection.service';

export const userDetectionRouter = Router();

/** Save a new detection record (called by mobile app after successful detect call) */
userDetectionRouter.post('/', [
  async (req: RequestContext, res: Response) => {
    try {
      const userId = req.currentUserSub;
      const body = req.body as {
        sceneDescription: string;
        detections: DetectionResult[];
        imageKey?: string;
      };
      const record: Partial<Detection> = {
        userId,
        sceneDescription: body.sceneDescription,
        detections: body.detections,
        imageKey: body.imageKey,
      };
      const created = await detectionService.create(record);
      res.json(detectionMapper(created));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to save detection: ${message}`);
      res.status(400).json({ error: 'Failed to save detection' });
    }
  },
]);

/** List the calling user's own detections */
userDetectionRouter.get('/my', [
  async (req: RequestContext, res: Response) => {
    try {
      const userId = req.currentUserSub;
      const all = await detectionService.getAll();
      const mine = all.filter((d) => d.userId === userId);
      res.json(mine.map(detectionMapper));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to get detections: ${message}`);
      res.status(400).json({ error: 'Failed to get detections' });
    }
  },
]);
