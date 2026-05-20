import { type Response, Router } from 'express';
import type { RequestContext } from '../../util/request-context.type';
import { interactWithVoice } from './assistant.service';

export const userAssistantRouter = Router();

/** POST /assistant/user/interact */
userAssistantRouter.post('/interact', [
  async (req: RequestContext, res: Response) => {
    try {
      const body = req.body as {
        audioBase64?: string;
        mimeType?: string;
        mode?: string;
        lastDetections?: string[];
        activeRouteStep?: string;
      };
      if (!body.audioBase64 || body.audioBase64.trim().length === 0) {
        return res.status(400).json({ error: 'audioBase64 is required' });
      }
      const result = await interactWithVoice({
        audioBase64: body.audioBase64,
        mimeType: body.mimeType,
        mode: body.mode,
        lastDetections: body.lastDetections,
        activeRouteStep: body.activeRouteStep,
      });
      return res.json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Assistant interaction failed';
      console.error('[assistant] interact error:', message);
      return res.status(500).json({ error: 'Assistant interaction failed' });
    }
  },
]);

