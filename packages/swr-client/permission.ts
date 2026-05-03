import useSWR from 'swr';
import { type Permission, type PermissionType } from '@baseline/types/permission';
import {
  getMyPermissions,
  getPermissionsForOwnerId,
  getPermissionsForType,
} from '@baseline/client-api/permission';
import { getRequestHandler } from '@baseline/client-api/request-handler';

export const useMyPermissions = () => {
  const { data, error, isLoading, mutate } = useSWR<Permission[], unknown>(
    'permission/admin/list',
    () => getMyPermissions(getRequestHandler()),
  );
  return { permissions: data, isLoading, error, mutatePermissions: mutate };
};

export const usePermissionsForOwnerId = (ownerId: string | undefined) => {
  const { data, error, isLoading, mutate } = useSWR<Permission[], unknown>(
    ownerId ? `permission/admin/owner/${ownerId}` : null,
    () => getPermissionsForOwnerId(getRequestHandler(), ownerId!),
  );
  return { permissions: data, isLoading, error, mutatePermissions: mutate };
};

export const usePermissionsForType = (type: PermissionType | undefined) => {
  const { data, error, isLoading, mutate } = useSWR<Permission[], unknown>(
    type ? `permission/admin/list/${type}` : null,
    () => getPermissionsForType(getRequestHandler(), type!),
  );
  return { permissions: data, isLoading, error, mutatePermissions: mutate };
};
