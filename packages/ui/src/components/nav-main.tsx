import * as React from 'react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../primitives/sidebar';

export type NavItem = {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
};

type RenderLink = (item: NavItem, children: React.ReactNode) => React.ReactNode;

export interface NavMainProps {
  items: NavItem[];
  renderLink?: RenderLink;
  isItemActive?: (item: NavItem) => boolean;
}

const defaultRenderLink: RenderLink = (item, children) => (
  <a href={item.url}>{children}</a>
);

export function NavMain({ items, renderLink, isItemActive }: NavMainProps) {
  const render = renderLink ?? defaultRenderLink;
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-1.5">
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            const active = isItemActive?.(item) ?? false;
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  className="rounded-lg"
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
