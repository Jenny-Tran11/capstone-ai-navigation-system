import type * as React from 'react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../primitives/sidebar';

export type NavItem = {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
  section?: string;
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
          {items.map((item, index) => {
            const Icon = item.icon;
            const active = isItemActive?.(item) ?? false;
            const previousSection =
              index > 0 ? items[index - 1]?.section : undefined;
            const showSection =
              !!item.section &&
              (index === 0 || item.section !== previousSection);
            return (
              <div key={item.url}>
                {showSection ? (
                  <SidebarGroupLabel className="px-1.5 py-0 h-6 text-[10px] uppercase tracking-wide">
                    {item.section}
                  </SidebarGroupLabel>
                ) : null}
                <SidebarMenuItem>
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
              </div>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
