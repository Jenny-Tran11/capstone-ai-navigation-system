import type { Permission, PermissionType } from '@baseline/types/permission';
import {
  getDynamodbConnection,
  queryItems,
  queryItemsRange,
} from '@baselinejs/dynamodb';
import { getErrorMessage } from '../../util/error-message';
import { ServiceObject } from '../../util/service-object';

const dynamoDb = getDynamodbConnection({
  region: process.env.API_REGION || '',
});

export const permissionService = new ServiceObject<Permission>({
  dynamoDb: dynamoDb,
  objectName: 'Permission',
  table: `${process.env.APP_NAME}-${process.env.NODE_ENV}-permission`,
  primaryKey: 'permissionId',
});

export const getPermissionsForOwnerId = async (
  ownerId: string,
  type?: PermissionType,
  value?: string,
): Promise<Permission[]> => {
  console.log(`Get ${permissionService.objectName} for ownerId [${ownerId}]`);

  try {
    if (type) {
      const compositeKey = [type, value].filter(Boolean).join('|');

      return await queryItemsRange<Permission>({
        dynamoDb: permissionService.dynamoDb,
        table: permissionService.table,
        keyName: 'ownerId',
        keyValue: ownerId,
        rangeKeyName: 'compositeKey',
        rangeKeyValue: compositeKey,
        indexName: 'ownerId-compositeKey-index',
      });
    }

    return await queryItems<Permission>({
      dynamoDb: permissionService.dynamoDb,
      table: permissionService.table,
      keyName: 'ownerId',
      keyValue: ownerId,
      indexName: 'ownerId-compositeKey-index',
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(
      `Failed to check ${permissionService.objectName}: ${message}`,
    );
    throw new Error(message);
  }
};

export const getPermissionsForType = async (
  type: PermissionType,
  compositeKey?: string,
): Promise<Permission[]> => {
  console.log(
    `Get ${permissionService.objectName} for type [${type}], compositeKey [${compositeKey}]`,
  );

  try {
    if (compositeKey) {
      return await queryItemsRange<Permission>({
        dynamoDb: permissionService.dynamoDb,
        table: permissionService.table,
        keyName: 'type',
        keyValue: type,
        rangeKeyName: 'compositeKey',
        rangeKeyValue: compositeKey,
        indexName: 'type-compositeKey-index',
      });
    }

    return await queryItems<Permission>({
      dynamoDb: permissionService.dynamoDb,
      table: permissionService.table,
      keyName: 'type',
      keyValue: type,
      indexName: 'type-compositeKey-index',
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(
      `Failed to check ${permissionService.objectName}: ${message}`,
    );
    throw new Error(message);
  }
};

export const getPermissionsByOwnerIdAndCompositeKey = async (
  ownerId: string,
  compositeKey?: string,
) => {
  console.log(
    `Get ${permissionService.objectName} by ownerId [${ownerId}] [${compositeKey}]`,
  );
  try {
    if (compositeKey) {
      return await queryItemsRange<Permission>({
        dynamoDb: permissionService.dynamoDb,
        table: permissionService.table,
        keyName: 'ownerId',
        keyValue: ownerId,
        rangeKeyName: 'compositeKey',
        rangeKeyValue: compositeKey,
        indexName: 'ownerId-compositeKey-index',
        fuzzy: true,
      });
    }

    return await queryItems<Permission>({
      dynamoDb: permissionService.dynamoDb,
      table: permissionService.table,
      keyName: 'ownerId',
      keyValue: ownerId,
      indexName: 'ownerId-compositeKey-index',
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(
      `Failed to get ${permissionService.objectName} by ownerId: ${message}`,
    );
    throw new Error(message);
  }
};
