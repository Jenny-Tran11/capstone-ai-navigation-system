import type { AppConfig } from '@baseline/types/app-config';
import { getDynamodbConnection } from '@baselinejs/dynamodb';
import { ServiceObject } from '../../util/service-object';

const dynamoDb = getDynamodbConnection({
  region: process.env.API_REGION || '',
});

export const appConfigService = new ServiceObject<AppConfig>({
  dynamoDb,
  objectName: 'AppConfig',
  table: `${process.env.APP_NAME}-${process.env.NODE_ENV}-app-config`,
  primaryKey: 'configId',
});

export const MOBILE_CONFIG_ID = 'mobile';

