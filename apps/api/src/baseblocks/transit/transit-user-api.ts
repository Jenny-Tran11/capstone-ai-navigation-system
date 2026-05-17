import { type Response, Router } from 'express';
import type { RequestContext } from '../../util/request-context.type';
import { detectTransitFromImage } from './transit.service';

export const userTransitRouter = Router();

/** POST /transit/user/detect */
userTransitRouter.post('/detect', [
  async (req: RequestContext, res: Response) => {
    try {
      const { image_base64 } = req.body as { image_base64?: string };
      if (!image_base64) {
        return res.status(400).json({ error: 'image_base64 is required' });
      }
      const result = await detectTransitFromImage(image_base64);
      return res.json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Transit detection failed';
      console.error('[transit] detect error:', message);
      if (message.includes('not configured')) {
        return res
          .status(503)
          .json({ error: 'Transit AI service not configured' });
      }
      return res.status(500).json({ error: 'Transit detection failed' });
    }
  },
]);
