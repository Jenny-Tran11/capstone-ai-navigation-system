import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigation } from 'react-router-dom';
import { fetchUserAttributes, signOut } from 'aws-amplify/auth';
import type { NavUserData } from '@baseline/ui/components/nav-user';
import { SidebarInset, SidebarProvider } from '@baseline/ui/primitives/sidebar';
import { SiteHeader } from '@baseline/ui/components/site-header';
import AdminSidebar from '../app-sidebar/AdminSidebar';
import Loader from '../page-content/loader/Loader';
import UserMenu from '../user-menu/UserMenu';

const ROUTE_TITLES: Array<[RegExp, string]> = [
  [/^\/dashboard\/?$/, 'Dashboard'],
  [/^\/admins\/?/, 'Admins'],
  [/^\/components\/?/, 'Components'],
  [/^\/settings\/?/, 'Account settings'],
];

function headingForPath(pathname: string): string {
  for (const [pattern, title] of ROUTE_TITLES) {
    if (pattern.test(pathname)) return title;
  }
  return '';
}

const Layout = () => {
  const navigation = useNavigation();
  const location = useLocation();
  const isLoading = navigation.state === 'loading';

  const [user, setUser] = useState<NavUserData>({
    name: 'Admin',
    email: '',
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const attrs = await fetchUserAttributes();
        if (cancelled) return;
        const email = attrs.email ?? '';
        const name =
          attrs.name ??
          attrs.preferred_username ??
          (email ? email.split('@')[0] : 'Admin');
        setUser({ name, email });
      } catch {
        if (!cancelled) setUser({ name: 'Admin', email: '' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const heading = useMemo(
    () => headingForPath(location.pathname),
    [location.pathname],
  );

  const handleSignOut = () => {
    void signOut();
  };

  return (
    <SidebarProvider
      className="h-svh overflow-hidden"
      defaultOpen={false}
      style={
        {
          '--sidebar-width': '13rem',
          '--header-height': '3rem',
        } as React.CSSProperties
      }
    >
      <AdminSidebar />
      <SidebarInset className="min-h-0 overflow-y-auto">
        <SiteHeader
          heading={heading}
          actions={
            <>
              <UserMenu user={user} onSignOut={handleSignOut} />
            </>
          }
        />
        <div className="@container/main flex min-h-0 flex-1 flex-col overflow-x-hidden bg-background">
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <Loader hasStartedLoading={true} />
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
