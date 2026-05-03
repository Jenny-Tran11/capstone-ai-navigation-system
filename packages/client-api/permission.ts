import { type Permission, type PermissionType } from '@baseline/types/permission';
import { RequestHandler } from './request-handler';

export const getMyPermissions = async (
  requestHandler: RequestHandler,
): Promise<Permission[]> => {
  const response = await requestHandler.request<Permission[]>({
    method: 'GET',
    url: 'permission/admin/list',
    hasAuthentication: true,
  });
  if ('data' in response) return response.data;
  throw response;
};

export const getPermissionsForOwnerId = async (
  requestHandler: RequestHandler,
  ownerId: string,
): Promise<Permission[]> => {
  const response = await requestHandler.request<Permission[]>({
    method: 'GET',
    url: `permission/admin/owner/${ownerId}`,
    hasAuthentication: true,
  });
  if ('data' in response) return response.data;
  throw response;
};

export const getPermissionsForType = async (
  requestHandler: RequestHandler,
  type: PermissionType,
): Promise<Permission[]> => {
  const response = await requestHandler.request<Permission[]>({
    method: 'GET',
    url: `permission/admin/list/${type}`,
    hasAuthentication: true,
  });
  if ('data' in response) return response.data;
  throw response;
};

export const createPermission = async (
  requestHandler: RequestHandler,
  data: { type: PermissionType; value?: string; ownerId: string },
): Promise<Permission> => {
  const response = await requestHandler.request<Permission>({
    method: 'POST',
    url: 'permission/admin',
    hasAuthentication: true,
    data,
  });
  if ('data' in response) return response.data;
  throw response;
};

export const deletePermission = async (
  requestHandler: RequestHandler,
  permissionId: string,
): Promise<boolean> => {
  const response = await requestHandler.request<boolean>({
    method: 'DELETE',
    url: `permission/admin/${permissionId}`,
    hasAuthentication: true,
  });
  if ('data' in response) return response.data;
  throw response;
};
