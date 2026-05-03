import { type Workspace } from '@baseline/types/workspace';

export const workspaceMapper = (data: Workspace): Workspace => {
  const workspace: Workspace = {
    workspaceId: data?.workspaceId,
    createdAt: data?.createdAt,
    updatedAt: data?.updatedAt,
    name: data?.name,
    description: data?.description,
    imageUrl: data?.imageUrl,
  };
  return workspace;
};
