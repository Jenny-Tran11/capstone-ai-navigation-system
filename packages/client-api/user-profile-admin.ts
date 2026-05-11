import type { RequestHandler } from './request-handler';

export type AdminUserProfile = {
  userId: string;
  displayName: string;
  preferences: Record<string, unknown>;
  permissionTypes?: string[];
  permissions?: Array<{ permissionId: string; type: string; value?: string }>;
  createdAt?: string;
  updatedAt?: string;
};

export const getAdminUserProfiles = async (
  requestHandler: RequestHandler,
): Promise<AdminUserProfile[]> => {
  const response = await requestHandler.request<AdminUserProfile[]>({
    method: 'GET',
    url: 'user-profile/admin/list',
    hasAuthentication: true,
  });
  if ('data' in response) return response.data;
  throw response;
};

export const updateAdminUserPreferences = async (
  requestHandler: RequestHandler,
  data: { userId: string; preferences: Record<string, unknown> },
): Promise<AdminUserProfile> => {
  const response = await requestHandler.request<AdminUserProfile>({
    method: 'PUT',
    url: 'user-profile/admin/preferences',
    hasAuthentication: true,
    data,
  });
  if ('data' in response) return response.data;
  throw response;
};

export const getAdminUserDetail = async (
  requestHandler: RequestHandler,
  userId: string,
): Promise<AdminUserProfile> => {
  const response = await requestHandler.request<AdminUserProfile>({
    method: 'GET',
    url: `user-profile/admin/${userId}`,
    hasAuthentication: true,
  });
  if ('data' in response) return response.data;
  throw response;
};

export const inviteAdminUser = async (
  requestHandler: RequestHandler,
  data: { email: string; grantSuper?: boolean; workspaceIds?: string[] },
): Promise<AdminUserProfile> => {
  const response = await requestHandler.request<AdminUserProfile>({
    method: 'POST',
    url: 'user-profile/admin/invite',
    hasAuthentication: true,
    data,
  });
  if ('data' in response) return response.data;
  throw response;
};

export const deleteAdminUser = async (
  requestHandler: RequestHandler,
  userId: string,
): Promise<boolean> => {
  const response = await requestHandler.request<{ success: boolean }>({
    method: 'DELETE',
    url: `user-profile/admin/${userId}`,
    hasAuthentication: true,
  });
  if ('data' in response) return Boolean(response.data?.success);
  throw response;
};
