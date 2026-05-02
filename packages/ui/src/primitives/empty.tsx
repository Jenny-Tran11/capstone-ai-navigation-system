import * as React from 'react';
import { cn } from '../lib/utils';

interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

function Empty({ className, icon, title, description, action, children, ...props }: EmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-16 text-center',
        className,
      )}
      {...props}
    >
      {icon && <div className="text-muted-foreground [&_svg]:size-12">{icon}</div>}
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div>{action}</div>}
      {children}
    </div>
  );
}

export { Empty };
