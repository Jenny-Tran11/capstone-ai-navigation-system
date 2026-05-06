import type { Admin } from '@baseline/types/admin';
import type { Permission } from '@baseline/types/permission';
import type { RequestHandler } from './request-handler';
type AdminUserProfile = { userId: string; displayName?: string };

export const getAllAdmins = async (
  requestHandler: RequestHandler,
): Promise<Admin[]> => {
  const response = await requestHandler.request<Permission[]>({
    method: 'GET',
    url: 'permission/admin/list/SUPER',
    hasAuthentication: true,
  });
  if ('data' in response) {
    const ownerIds = Array.from(
      new Set(
        (response.data ?? [])
          .map((permission) => permission.ownerId)
          .filter(Boolean),
      ),
    );
    if (!ownerIds.length) return [];

    const profileResponse = await requestHandler.request<AdminUserProfile[]>({
      method: 'GET',
      url: 'user-profile/admin/list',
      hasAuthentication: true,
    });

    if (!('data' in profileResponse)) {
      return ownerIds.map((ownerId) => ({
        userSub: ownerId,
        userEmail: ownerId,
      }));
    }

    const profileByUserId = new Map(
      (profileResponse.data ?? []).map((profile) => [profile.userId, profile]),
    );

    return ownerIds.map((ownerId) => {
      const profile = profileByUserId.get(ownerId);
      return {
        userSub: ownerId,
        userEmail: profile?.displayName?.trim() || ownerId,
      };
    });
  }
  throw response;
};

export const deleteAdmin = async (
  _requestHandler: RequestHandler,
  _data: { adminId: string },
): Promise<boolean> => {
  throw new Error(
    'Legacy /admin API is deprecated. Remove SUPER permission instead.',
  );
};

export const createAdmin = async (
  _requestHandler: RequestHandler,
  _data: { userEmail: string },
): Promise<Admin> => {
  throw new Error(
    'Legacy /admin API is deprecated. Grant SUPER permission instead.',
  );
};

export const checkAdmin = async (
  requestHandler: RequestHandler,
): Promise<boolean> => {
  const response = await requestHandler.request<Permission[]>({
    method: 'GET',
    url: 'permission/admin/list',
    hasAuthentication: true,
  });
  if ('data' in response) {
    return response.data.some((permission) => permission.type === 'SUPER');
  }
  return false;
};
