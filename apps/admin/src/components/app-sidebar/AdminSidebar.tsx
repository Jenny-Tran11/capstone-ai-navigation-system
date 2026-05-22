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
  IconTool,
  IconUsers,
} from '@tabler/icons-react';
import { NavLink, useLocation } from 'react-router-dom';

const navMain: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: IconDashboard,
    section: 'Overview',
  },
  { title: 'Users', url: '/users', icon: IconUsers, section: 'Access' },
  {
    title: 'Permissions',
    url: '/permissions',
    icon: IconKey,
    section: 'Access',
  },
  {
    title: 'Workspaces',
    url: '/workspaces',
    icon: IconBuilding,
    section: 'Resources',
  },
  { title: 'Detections', url: '/detections', icon: IconEye, section: 'AI' },
  { title: 'Model', url: '/model', icon: IconCpu, section: 'AI' },
  {
    title: 'Runtime config',
    url: '/runtime-config',
    icon: IconTool,
    section: 'AI',
  },
  {
    title: 'Components',
    url: '/components',
    icon: IconLayoutGrid,
    section: 'Developer',
  },
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
