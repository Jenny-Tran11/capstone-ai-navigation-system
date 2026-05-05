import type { UserProfile } from '@baseline/types/user-profile';
import { getDynamodbConnection } from '@baselinejs/dynamodb';
import { ServiceObject } from '../../util/service-object';

const dynamoDb = getDynamodbConnection({
  region: process.env.API_REGION || '',
});

export const userProfileService = new ServiceObject<UserProfile>({
  dynamoDb,
  objectName: 'UserProfile',
  table: `${process.env.APP_NAME}-${process.env.NODE_ENV}-user-profile`,
  primaryKey: 'userId',
});
