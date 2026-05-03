import * as React from 'react';
import { cn } from '../lib/utils';

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex', className)} {...props} />
));
InputGroup.displayName = 'InputGroup';

const InputGroupAddon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'inline-flex items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground',
      className,
    )}
    {...props}
  />
));
InputGroupAddon.displayName = 'InputGroupAddon';

export { InputGroup, InputGroupAddon };
