import { getAllAdmins } from '@baseline/client-api/admin';
import { getRequestHandler } from '@baseline/client-api/request-handler';
import type { Admin } from '@baseline/types/admin';
import { useLoaderData } from 'react-router-dom';
import PageContent from '../../../components/page-content/PageContent';
import AdminList from '../components/admin-list/AdminList';

export async function adminListLoader() {
  const admins = await getAllAdmins(getRequestHandler());
  return {
    admins: admins,
  };
}

const Admins = (): JSX.Element => {
  const { admins } = useLoaderData() as { admins: Admin[] };

  return (
    <PageContent
      breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Admins' }]}
    >
      <AdminList admins={admins} />
    </PageContent>
  );
};

export default Admins;
