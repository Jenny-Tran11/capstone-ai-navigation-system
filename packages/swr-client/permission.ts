import {
  getMyPermissions,
  getPermissionsForOwnerId,
  getPermissionsForType,
} from '@baseline/client-api/permission';
import { getRequestHandler } from '@baseline/client-api/request-handler';
import type { Permission, PermissionType } from '@baseline/types/permission';
import useSWR from 'swr';

export const useMyPermissions = () => {
  const { data, error, isLoading, mutate } = useSWR<Permission[], unknown>(
    'permission/admin/list',
    () => getMyPermissions(getRequestHandler()),
  );
  return { permissions: data, isLoading, error, mutatePermissions: mutate };
};

export const usePermissionsForOwnerId = (ownerId: string | undefined) => {
  const { data, error, isLoading, mutate } = useSWR<Permission[], unknown>(
    ownerId ? (['permission/admin/owner', ownerId] as const) : null,
    ([, id]: readonly [string, string]) =>
      getPermissionsForOwnerId(getRequestHandler(), id),
  );
  return { permissions: data, isLoading, error, mutatePermissions: mutate };
};

export const usePermissionsForType = (type: PermissionType | undefined) => {
  const { data, error, isLoading, mutate } = useSWR<Permission[], unknown>(
    type ? (['permission/admin/list', type] as const) : null,
    ([, permissionType]: readonly [string, PermissionType]) =>
      getPermissionsForType(getRequestHandler(), permissionType),
  );
  return { permissions: data, isLoading, error, mutatePermissions: mutate };
};
