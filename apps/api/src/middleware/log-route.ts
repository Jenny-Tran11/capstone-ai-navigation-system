import type { NextFunction, Response } from 'express';
import type { RequestContext } from '../util/request-context.type';

export const logRoute = (
  req: RequestContext,
  _res: Response,
  next: NextFunction,
) => {
  console.log(`Request: ${req.method} ${req.originalUrl}`);
  next();
};
