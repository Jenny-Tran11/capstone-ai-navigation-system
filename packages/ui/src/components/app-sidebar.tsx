import * as React from 'react';
import { IconInnerShadowTop } from '@tabler/icons-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../primitives/sidebar';
import { NavMain, type NavItem } from './nav-main';
import { NavSecondary } from './nav-secondary';
import { NavUser, type NavUserData } from './nav-user';

type RenderLink = (item: NavItem, children: React.ReactNode) => React.ReactNode;

export interface AppSidebarBrand {
  name: React.ReactNode;
  url?: string;
  logo?: React.ComponentType<{ className?: string }>;
}

export interface AppSidebarProps
  extends Omit<React.ComponentProps<typeof Sidebar>, 'children'> {
  brand: AppSidebarBrand;
  navMain: NavItem[];
  navSecondary?: NavItem[];
  user?: NavUserData;
  renderLink?: RenderLink;
  isItemActive?: (item: NavItem) => boolean;
  onSignOut?: () => void;
}

const defaultRenderLink: RenderLink = (item, children) => (
  <a href={item.url}>{children}</a>
);

export function AppSidebar({
  brand,
  navMain,
  navSecondary,
  user,
  renderLink,
  isItemActive,
  onSignOut,
  collapsible = 'offcanvas',
  variant,
  ...props
}: AppSidebarProps) {
  const { state, isMobile } = useSidebar();
  const render = renderLink ?? defaultRenderLink;
  const Logo = brand.logo ?? IconInnerShadowTop;
  const isCollapsedDesktop = !isMobile && state === 'collapsed';

  const brandItem: NavItem = {
    title: typeof brand.name === 'string' ? brand.name : 'Home',
    url: brand.url ?? '#',
  };

  return (
    <Sidebar collapsible={collapsible} variant={variant} {...props}>
      <SidebarHeader className="border-b border-sidebar-border/70 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="rounded-lg group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            >
              {render(
                brandItem,
                <>
                  <Logo className="!size-4" />
                  {!isCollapsedDesktop ? (
                    <span className="truncate font-semibold text-[15px]">
                      {brand.name}
                    </span>
                  ) : null}
                </>,
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={navMain}
          renderLink={render}
          isItemActive={isItemActive}
        />
        {navSecondary && navSecondary.length > 0 ? (
          <NavSecondary
            items={navSecondary}
            renderLink={render}
            isItemActive={isItemActive}
            className="mt-auto"
          />
        ) : null}
      </SidebarContent>
      {user ? (
        <SidebarFooter>
          <NavUser user={user} onSignOut={onSignOut} />
        </SidebarFooter>
      ) : null}
    </Sidebar>
  );
}
