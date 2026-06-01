import compression from 'compression';
import cors from 'cors';
import express, { type Application } from 'express';
import { logRoute } from '../middleware/log-route';
import type { RequestContext } from './request-context.type';

function extractSubFromAuthHeader(authHeader?: string): string | undefined {
  if (!authHeader?.startsWith('Bearer ')) return undefined;
  const token = authHeader.slice('Bearer '.length).trim();
  const parts = token.split('.');
  if (parts.length < 2) return undefined;
  try {
    const payloadRaw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadRaw + '='.repeat((4 - (payloadRaw.length % 4)) % 4);
    const payload = JSON.parse(
      Buffer.from(padded, 'base64').toString('utf8'),
    ) as { sub?: string };
    return payload.sub;
  } catch {
    return undefined;
  }
}

const createApp = (): Application => {
  const corsOptions = {
    origin: process.env.API_CORS_ORIGIN,
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  };

  const bodySizeLimit = process.env.API_BODY_SIZE_LIMIT ?? '50mb';

  const app = express();
  app.use(express.urlencoded({ extended: true, limit: bodySizeLimit }));
  app.use(express.json({ limit: bodySizeLimit }));
  app.use((req, _res, next) => {
    const request = req as RequestContext;
    const fromHeader = extractSubFromAuthHeader(req.headers.authorization);
    const sub = request.currentUserSub?.trim();
    if (!sub || sub === 'undefined') {
      request.currentUserSub = fromHeader ?? '';
    }
    next();
  });
  app.use(compression());
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(logRoute);
  return app;
};

export default createApp;
