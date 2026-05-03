import type {
  APIGatewayEventDefaultAuthorizerContext,
  APIGatewayEventRequestContextWithAuthorizer,
} from 'aws-lambda';
import type { Request } from 'express';

export type RequestContext = Request & {
  context: APIGatewayEventRequestContextWithAuthorizer<Authorizer>;
} & {
  currentUserSub: string;
};

export type Authorizer = APIGatewayEventDefaultAuthorizerContext & {
  claims: { email?: string; sub?: string };
};
