import type { Workspace } from '@baseline/types/workspace';
import { getDynamodbConnection } from '@baselinejs/dynamodb';
import { ServiceObject } from '../../util/service-object';

const dynamoDb = getDynamodbConnection({
  region: process.env.API_REGION || '',
});

export const workspaceService = new ServiceObject<Workspace>({
  dynamoDb: dynamoDb,
  objectName: 'Workspace',
  table: `${process.env.APP_NAME}-${process.env.NODE_ENV}-workspace`,
  primaryKey: 'workspaceId',
});
