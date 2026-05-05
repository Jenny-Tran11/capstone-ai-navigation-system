import compression from 'compression';
import cors from 'cors';
import express, { type Application } from 'express';
import { logRoute } from '../middleware/log-route';

const createApp = (): Application => {
  const corsOptions = {
    origin: process.env.API_CORS_ORIGIN,
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  };

  const bodySizeLimit = process.env.API_BODY_SIZE_LIMIT ?? '50mb';

  const app = express();
  app.use(express.urlencoded({ extended: true, limit: bodySizeLimit }));
  app.use(express.json({ limit: bodySizeLimit }));
  app.use(compression());
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(logRoute);
  return app;
};

export default createApp;
