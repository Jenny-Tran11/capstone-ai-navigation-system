import React from 'react';
import { useLoaderData } from 'react-router-dom';
import { type Permission, type PermissionType } from '@baseline/types/permission';
import { getPermissionsForType } from '@baseline/client-api/permission';
import { getRequestHandler } from '@baseline/client-api/request-handler';
import PageContent from '../../../components/page-content/PageContent';
import PermissionList from '../components/permission-list/PermissionList';

export async function permissionListLoader() {
  const permissions = await getPermissionsForType(getRequestHandler(), 'SUPER' as PermissionType);
  return { permissions };
}

const Permissions = (): JSX.Element => {
  const { permissions } = useLoaderData() as { permissions: Permission[] };

  return (
    <PageContent
      breadcrumbs={[
        { label: 'Home', href: '/dashboard' },
        { label: 'Permissions' },
      ]}
    >
      <PermissionList permissions={permissions} />
    </PageContent>
  );
};

export default Permissions;
