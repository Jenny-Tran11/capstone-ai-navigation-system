import type * as React from 'react';
import { cn } from '../lib/utils';

export interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContent({ children, className }: PageContentProps) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 px-4 py-4 md:gap-6 md:px-6 md:py-6 lg:px-8',
        className,
      )}
    >
      {children}
    </div>
  );
}
