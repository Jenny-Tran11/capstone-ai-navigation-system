import type { APIGatewayProxyEventBase } from 'aws-lambda';
import type { Application } from 'express';
import serverless from 'serverless-http';
import type { Authorizer, RequestContext } from './request-context.type';

const createAuthenticatedHandler = (app: Application) => {
  const handler = serverless(app, {
    request(
      request: RequestContext,
      event: APIGatewayProxyEventBase<Authorizer>,
    ) {
      request.context = event.requestContext;
      const sub = request.context?.authorizer?.claims?.sub;
      request.currentUserSub =
        typeof sub === 'string' && sub.length > 0 ? sub : '';
    },
  });
  return handler;
};

export default createAuthenticatedHandler;
