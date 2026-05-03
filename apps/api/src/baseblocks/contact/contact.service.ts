import type { ContactSubmission } from '@baseline/types/contact';
import { getDynamodbConnection } from '@baselinejs/dynamodb';
import { ServiceObject } from '../../util/service-object';

const dynamoDb = getDynamodbConnection({
  region: `${process.env.API_REGION}`,
});

export const contactService = new ServiceObject<ContactSubmission>({
  dynamoDb: dynamoDb,
  objectName: 'ContactSubmission',
  table: `${process.env.APP_NAME}-${process.env.NODE_ENV}-contact`,
  primaryKey: 'id',
});
