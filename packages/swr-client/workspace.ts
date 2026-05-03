import { getRequestHandler } from '@baseline/client-api/request-handler';
import {
  getAllWorkspaces,
  getMyWorkspaces,
} from '@baseline/client-api/workspace';
import type { Workspace } from '@baseline/types/workspace';
import useSWR from 'swr';

export const useWorkspaces = () => {
  const { data, error, isLoading, mutate } = useSWR<Workspace[], unknown>(
    'workspace/admin/list',
    () => getAllWorkspaces(getRequestHandler()),
  );
  return { workspaces: data, isLoading, error, mutateWorkspaces: mutate };
};

export const useMyWorkspaces = () => {
  const { data, error, isLoading, mutate } = useSWR<Workspace[], unknown>(
    'workspace/user/list',
    () => getMyWorkspaces(getRequestHandler()),
  );
  return { workspaces: data, isLoading, error, mutateWorkspaces: mutate };
};
