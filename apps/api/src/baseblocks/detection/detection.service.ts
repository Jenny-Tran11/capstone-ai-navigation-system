import type { Detection } from '@baseline/types/detection';
import { getDynamodbConnection } from '@baselinejs/dynamodb';
import { ServiceObject } from '../../util/service-object';

const dynamoDb = getDynamodbConnection({
  region: process.env.API_REGION || '',
});

export const detectionService = new ServiceObject<Detection>({
  dynamoDb,
  objectName: 'Detection',
  table: `${process.env.APP_NAME}-${process.env.NODE_ENV}-detection`,
  primaryKey: 'detectionId',
  ownerField: 'userId',
});
