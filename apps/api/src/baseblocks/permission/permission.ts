import type { Permission } from '@baseline/types/permission';

export const permissionMapper = (data: Permission): Permission => {
  const permission: Permission = {
    permissionId: data?.permissionId,
    type: data?.type,
    value: data?.value,
    compositeKey: data?.compositeKey,
    ownerId: data?.ownerId,
    createdAt: data?.createdAt,
    updatedAt: data?.updatedAt,
  };
  return permission;
};
