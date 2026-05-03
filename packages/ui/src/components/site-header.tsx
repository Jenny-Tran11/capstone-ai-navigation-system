import type * as React from 'react';
import { cn } from '../lib/utils';
import { Separator } from '../primitives/separator';
import { SidebarTrigger } from '../primitives/sidebar';

export interface SiteHeaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  heading?: React.ReactNode;
  actions?: React.ReactNode;
}

export function SiteHeader({
  heading,
  actions,
  className,
  children,
  ...props
}: SiteHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border/70 bg-background/70 backdrop-blur-sm supports-backdrop-filter:bg-background/55 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)',
        className,
      )}
      {...props}
    >
      <div className="flex w-full min-w-0 items-center gap-1.5 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {heading ? (
          <h1 className="min-w-0 truncate font-semibold text-base tracking-tight">
            {heading}
          </h1>
        ) : null}
        {children}
        {actions ? (
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
