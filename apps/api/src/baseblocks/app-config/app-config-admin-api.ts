import type { MobileRuntimeConfig } from '@baseline/types/app-config';
import { type Response, Router } from 'express';
import { checkPermission } from '../../middleware/check-permission';
import { getErrorMessage } from '../../util/error-message';
import type { RequestContext } from '../../util/request-context.type';
import {
  getMobileRuntimeConfig,
  normalizeMobilePatch,
  saveMobileRuntimeConfig,
} from './app-config';

export const adminAppConfigRouter = Router();

function isRoboflowWorkflowEndpoint(url: string): boolean {
  return url.includes('serverless.roboflow.com') && url.includes('/workflows/');
}

function getRoboflowModelIdFromEndpoint(url: string): string | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const version = parts[parts.length - 1];
    const model = parts[parts.length - 2];
    if (!/^\d+$/.test(version) || !model) return null;
    return `${model}/${version}`;
  } catch {
    return null;
  }
}

/** GET /app-config/admin/mobile */
adminAppConfigRouter.get('/mobile', [
  checkPermission([{ type: 'SUPER' }]),
  async (_req: RequestContext, res: Response) => {
    const config = await getMobileRuntimeConfig();
    res.json(config);
  },
]);

/** PUT /app-config/admin/mobile */
adminAppConfigRouter.put('/mobile', [
  checkPermission([{ type: 'SUPER' }]),
  async (req: RequestContext, res: Response) => {
    try {
      const patch = normalizeMobilePatch(
        req.body as Partial<MobileRuntimeConfig>,
      );
      const existing = await getMobileRuntimeConfig();
      const next: MobileRuntimeConfig = { ...existing, ...patch };
      await saveMobileRuntimeConfig(next);
      res.json(next);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to update app config: ${message}`);
      res.status(400).json({ error: 'Failed to update app config' });
    }
  },
]);

/** POST /app-config/admin/mobile/health */
adminAppConfigRouter.post('/mobile/health', [
  checkPermission([{ type: 'SUPER' }]),
  async (_req: RequestContext, res: Response) => {
    try {
      const config = await getMobileRuntimeConfig();
      const baseUrl = (config.detectApiBaseUrl || '').replace(/\/$/, '');
      if (!baseUrl) {
        res.status(400).json({ error: 'Detect API URL is not configured.' });
        return;
      }
      const health = await fetch(`${baseUrl}/health`);
      if (!health.ok) {
        throw new Error(`Health check failed: ${health.status}`);
      }
      res.json(await health.json());
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to proxy model health check: ${message}`);
      res.status(400).json({ error: 'Could not reach model health endpoint.' });
    }
  },
]);

/** POST /app-config/admin/mobile/test */
adminAppConfigRouter.post('/mobile/test', [
  checkPermission([{ type: 'SUPER' }]),
  async (req: RequestContext, res: Response) => {
    try {
      const { model, imageBase64, imageUrl } = req.body as {
        model?: 'detect' | 'crossing';
        imageBase64?: string;
        imageUrl?: string;
      };
      if (!imageBase64 && !imageUrl) {
        res.status(400).json({ error: 'imageBase64 or imageUrl is required.' });
        return;
      }

      const config = await getMobileRuntimeConfig();
      const isCrossing = model === 'crossing';
      const baseUrl = (
        isCrossing ? config.crossingApiBaseUrl : config.detectApiBaseUrl
      ).replace(/\/$/, '');
      const apiKey = isCrossing ? config.crossingApiKey : config.detectApiKey;
      const roboflowModelId = getRoboflowModelIdFromEndpoint(baseUrl);

      if (!baseUrl) {
        res.status(400).json({
          error: isCrossing
            ? 'Crossing API URL is not configured.'
            : 'Detect API URL is not configured.',
        });
        return;
      }

      if (isCrossing) {
        if (roboflowModelId) {
          const inferenceEndpoint = `${new URL(baseUrl).origin}/infer/object_detection`;
          const crossing = await fetch(inferenceEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: `admin-crossing-${Date.now()}`,
              api_key: apiKey,
              model_id: roboflowModelId,
              image: imageUrl?.trim()
                ? { type: 'url', value: imageUrl.trim() }
                : { type: 'base64', value: imageBase64 },
            }),
          });
          if (!crossing.ok) {
            const body = await crossing.text();
            throw new Error(`Crossing test failed: ${crossing.status} ${body}`);
          }
          res.json(await crossing.json());
          return;
        }

        const crossingImage =
          imageUrl?.trim()
            ? { type: 'url', value: imageUrl.trim() }
            : { type: 'base64', value: imageBase64 };
        const crossing = await fetch(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: apiKey,
            inputs: { image: crossingImage },
          }),
        });
        if (!crossing.ok) {
          const body = await crossing.text();
          throw new Error(`Crossing test failed: ${crossing.status} ${body}`);
        }
        res.json(await crossing.json());
        return;
      }

      const isWorkflow = isRoboflowWorkflowEndpoint(baseUrl);
      if (roboflowModelId) {
        const inferenceEndpoint = `${new URL(baseUrl).origin}/infer/object_detection`;
        const detect = await fetch(inferenceEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `admin-detect-${Date.now()}`,
            api_key: apiKey,
            model_id: roboflowModelId,
            image: imageUrl?.trim()
              ? { type: 'url', value: imageUrl.trim() }
              : { type: 'base64', value: imageBase64 },
          }),
        });
        if (!detect.ok) {
          const body = await detect.text();
          throw new Error(`Detect test failed: ${detect.status} ${body}`);
        }
        res.json(await detect.json());
        return;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey && !isWorkflow) headers['X-API-Key'] = apiKey;
      const detectEndpoint = isWorkflow ? baseUrl : `${baseUrl}/detect`;
      const detectPayload = isWorkflow
        ? {
            api_key: apiKey,
            inputs: {
              image:
                imageUrl?.trim()
                  ? { type: 'url', value: imageUrl.trim() }
                  : { type: 'base64', value: imageBase64 },
            },
          }
        : { image_base64: imageBase64 };
      const detect = await fetch(detectEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(detectPayload),
      });
      if (!detect.ok) {
        const body = await detect.text();
        throw new Error(`Detect test failed: ${detect.status} ${body}`);
      }
      res.json(await detect.json());
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to proxy model test: ${message}`);
      res.status(400).json({ error: message });
    }
  },
]);
