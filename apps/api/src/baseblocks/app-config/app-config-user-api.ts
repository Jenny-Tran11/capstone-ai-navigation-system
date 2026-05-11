import { type Response, Router } from 'express';
import type { RequestContext } from '../../util/request-context.type';
import { getMobileRuntimeConfig } from './app-config';

export const userAppConfigRouter = Router();

/** GET /app-config/user/mobile */
userAppConfigRouter.get('/mobile', [
  async (_req: RequestContext, res: Response) => {
    const config = await getMobileRuntimeConfig();
    res.json(config);
  },
]);
