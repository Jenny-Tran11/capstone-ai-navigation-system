import { AppSidebar } from '@baseline/ui/components/app-sidebar';
import type { NavItem } from '@baseline/ui/components/nav-main';
import {
  IconBuilding,
  IconCpu,
  IconDashboard,
  IconEye,
  IconKey,
  IconLayoutGrid,
  IconSettings,
  IconUsers,
} from '@tabler/icons-react';
import { NavLink, useLocation } from 'react-router-dom';

const navMain: NavItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: IconDashboard },
  { title: 'Admins', url: '/admins', icon: IconUsers },
  { title: 'Workspaces', url: '/workspaces', icon: IconBuilding },
  { title: 'Permissions', url: '/permissions', icon: IconKey },
  { title: 'Detections', url: '/detections', icon: IconEye },
  { title: 'Model', url: '/model', icon: IconCpu },
  { title: 'Components', url: '/components', icon: IconLayoutGrid },
];

const navSecondary: NavItem[] = [
  { title: 'Account settings', url: '/settings', icon: IconSettings },
];

export default function AdminSidebar() {
  const location = useLocation();

  const isItemActive = (item: NavItem) => {
    if (item.url === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return (
      location.pathname === item.url ||
      location.pathname.startsWith(`${item.url}/`)
    );
  };

  return (
    <AppSidebar
      variant="inset"
      collapsible="icon"
      brand={{ name: 'AI-Detect', url: '/dashboard' }}
      navMain={navMain}
      navSecondary={navSecondary}
      isItemActive={isItemActive}
      renderLink={(item, children) => (
        <NavLink to={item.url} end={item.url === '/dashboard'}>
          {children}
        </NavLink>
      )}
    />
  );
}
