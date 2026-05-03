import type { Permission, PermissionType } from '@baseline/types/permission';
import { getPermissionsForOwnerId, permissionService } from './permission.service';

export const checkPermissionForUserId = async (
  ownerId: string,
  type?: PermissionType,
  value?: string,
) => {
  console.log(
    `Check ${permissionService.objectName} for ownerId [${ownerId}], type [${type}], value [${value}]`,
  );

  const permissions = await getPermissionsForOwnerId(ownerId, type, value);
  return !!permissions.length;
};

export const createPermission = async (
  permissionData: Omit<Permission, 'permissionId' | 'compositeKey'>,
) => {
  const { type, value, ownerId } = permissionData;

  return await permissionService.create({
    type,
    value,
    ownerId,
    compositeKey: [type, value].filter(Boolean).join('|'),
  });
};
