import type { Workspace } from '@baseline/types/workspace';
import type { RequestHandler } from './request-handler';

export const getAllWorkspaces = async (
  requestHandler: RequestHandler,
): Promise<Workspace[]> => {
  const response = await requestHandler.request<Workspace[]>({
    method: 'GET',
    url: 'workspace/admin/list',
    hasAuthentication: true,
  });
  if ('data' in response) return response.data;
  throw response;
};

export const getWorkspace = async (
  requestHandler: RequestHandler,
  workspaceId: string,
): Promise<Workspace> => {
  const response = await requestHandler.request<Workspace>({
    method: 'GET',
    url: `workspace/admin/${workspaceId}`,
    hasAuthentication: true,
  });
  if ('data' in response) return response.data;
  throw response;
};

export const createWorkspace = async (
  requestHandler: RequestHandler,
  data: Pick<Workspace, 'name'> &
    Partial<Pick<Workspace, 'description' | 'imageUrl'>>,
): Promise<Workspace> => {
  const response = await requestHandler.request<Workspace>({
    method: 'POST',
    url: 'workspace/admin',
    hasAuthentication: true,
    data,
  });
  if ('data' in response) return response.data;
  throw response;
};

export const updateWorkspace = async (
  requestHandler: RequestHandler,
  data: Pick<Workspace, 'workspaceId'> &
    Partial<Pick<Workspace, 'name' | 'description' | 'imageUrl'>>,
): Promise<Workspace> => {
  const response = await requestHandler.request<Workspace>({
    method: 'PATCH',
    url: 'workspace/admin',
    hasAuthentication: true,
    data,
  });
  if ('data' in response) return response.data;
  throw response;
};

export const deleteWorkspace = async (
  requestHandler: RequestHandler,
  workspaceId: string,
): Promise<boolean> => {
  const response = await requestHandler.request<boolean>({
    method: 'DELETE',
    url: `workspace/admin/${workspaceId}`,
    hasAuthentication: true,
  });
  if ('data' in response) return response.data;
  throw response;
};

export const getMyWorkspaces = async (
  requestHandler: RequestHandler,
): Promise<Workspace[]> => {
  const response = await requestHandler.request<Workspace[]>({
    method: 'GET',
    url: 'workspace/user/list',
    hasAuthentication: true,
  });
  if ('data' in response) return response.data;
  throw response;
};
