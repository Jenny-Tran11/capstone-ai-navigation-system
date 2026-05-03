import { fetchUserAttributes } from 'aws-amplify/auth';
import { useLoaderData } from 'react-router-dom';
import PageContent from '../../../components/page-content/PageContent';
import UserSettings from '../components/user-settings/UserSettings';

export async function userLoader() {
  const { email, email_verified } = await fetchUserAttributes();
  return {
    user: {
      email,
      email_verified,
    },
  };
}

const User = (): JSX.Element => {
  const { user } = useLoaderData() as {
    user: { email: string; email_verified: boolean };
  };

  return (
    <PageContent
      breadcrumbs={[
        { label: 'Home', href: '/dashboard' },
        { label: 'Account settings' },
      ]}
    >
      <UserSettings
        user={{
          email: user.email,
          email_verified: user.email_verified,
        }}
      />
    </PageContent>
  );
};

export default User;
