import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../primitives/avatar';
import { Badge } from '../primitives/badge';
import { cn } from '../lib/utils';

export interface AdminListItemProps {
  name: string;
  detail?: string;
  role?: string;
  avatarUrl?: string;
  avatarFallback?: string;
  className?: string;
  actions?: React.ReactNode;
}

export function AdminListItem({
  name,
  detail,
  role,
  avatarUrl,
  avatarFallback,
  className,
  actions,
}: AdminListItemProps) {
  const fallback =
    avatarFallback ??
    name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3',
        className,
      )}
    >
      <Avatar className="h-9 w-9 shrink-0">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
        <AvatarFallback className="bg-muted font-medium text-muted-foreground text-xs">
          {fallback}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground text-sm">{name}</p>
        {detail ? (
          <p className="truncate text-muted-foreground text-xs">{detail}</p>
        ) : null}
      </div>

      {role ? (
        <Badge variant="outline" className="shrink-0 font-normal">
          {role}
        </Badge>
      ) : null}

      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
