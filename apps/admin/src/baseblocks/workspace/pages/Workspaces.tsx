import React from 'react';
import { useLoaderData } from 'react-router-dom';
import { type Workspace } from '@baseline/types/workspace';
import { getAllWorkspaces } from '@baseline/client-api/workspace';
import { getRequestHandler } from '@baseline/client-api/request-handler';
import PageContent from '../../../components/page-content/PageContent';
import WorkspaceList from '../components/workspace-list/WorkspaceList';

export async function workspaceListLoader() {
  const workspaces = await getAllWorkspaces(getRequestHandler());
  return { workspaces };
}

const Workspaces = (): JSX.Element => {
  const { workspaces } = useLoaderData() as { workspaces: Workspace[] };

  return (
    <PageContent
      breadcrumbs={[
        { label: 'Home', href: '/dashboard' },
        { label: 'Workspaces' },
      ]}
    >
      <WorkspaceList workspaces={workspaces} />
    </PageContent>
  );
};

export default Workspaces;
