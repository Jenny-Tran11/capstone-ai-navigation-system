import type * as React from 'react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../primitives/sidebar';
import type { NavItem } from './nav-main';

type RenderLink = (item: NavItem, children: React.ReactNode) => React.ReactNode;

export interface NavSecondaryProps
  extends React.ComponentPropsWithoutRef<typeof SidebarGroup> {
  items: NavItem[];
  renderLink?: RenderLink;
  isItemActive?: (item: NavItem) => boolean;
}

const defaultRenderLink: RenderLink = (item, children) => (
  <a href={item.url}>{children}</a>
);

export function NavSecondary({
  items,
  renderLink,
  isItemActive,
  ...props
}: NavSecondaryProps) {
  const render = renderLink ?? defaultRenderLink;
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            const active = isItemActive?.(item) ?? false;
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  size="sm"
                  isActive={active}
                  tooltip={item.title}
                >
                  {render(
                    item,
                    <>
                      {Icon ? <Icon /> : null}
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </>,
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
