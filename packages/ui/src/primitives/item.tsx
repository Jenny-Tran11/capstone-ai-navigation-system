import * as React from 'react';
import { cn } from '../lib/utils';

interface ItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  label?: string;
  description?: string;
  action?: React.ReactNode;
  asChild?: boolean;
}

const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ className, icon, label, description, action, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center gap-3 rounded-md p-3 hover:bg-accent transition-colors', className)}
      {...props}
    >
      {icon && <div className="shrink-0 text-muted-foreground [&_svg]:size-5">{icon}</div>}
      <div className="flex-1 min-w-0">
        {label && <div className="text-sm font-medium leading-none">{label}</div>}
        {description && <div className="text-xs text-muted-foreground mt-1">{description}</div>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  ),
);
Item.displayName = 'Item';

export { Item };
