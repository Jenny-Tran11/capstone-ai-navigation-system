import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconDeviceDesktop,
  IconLogout,
  IconMoon,
  IconSettings,
  IconSun,
} from '@tabler/icons-react';
import { useTheme } from 'next-themes';
import type { NavUserData } from '@baseline/ui/components/nav-user';
import { Avatar, AvatarFallback, AvatarImage } from '@baseline/ui/primitives/avatar';
import { Button } from '@baseline/ui/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@baseline/ui/primitives/dropdown-menu';

interface UserMenuProps {
  user: NavUserData;
  onSignOut: () => void;
}

function initialsOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'U';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UserMenu({ user, onSignOut }: UserMenuProps) {
  const navigate = useNavigate();
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initials = useMemo(
    () => initialsOf(user.name || user.email || 'Admin'),
    [user.name, user.email],
  );
  const activeTheme = theme ?? (resolvedTheme === 'dark' ? 'dark' : 'light');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="size-8 rounded-full">
          <Avatar className="size-8">
            {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="grid gap-0.5">
            <span className="truncate font-medium text-sm">{user.name || 'Admin'}</span>
            <span className="truncate text-muted-foreground text-xs">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-1 pb-1">
          <div className="grid h-9 grid-cols-3 gap-1 rounded-xl bg-muted p-1">
            <Button
              type="button"
              size="icon"
              variant={activeTheme === 'light' ? 'default' : 'ghost'}
              className="h-7 w-full rounded-lg"
              onClick={() => setTheme('light')}
              disabled={!mounted}
              aria-label="Switch to light mode"
            >
              <IconSun className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={activeTheme === 'dark' ? 'default' : 'ghost'}
              className="h-7 w-full rounded-lg"
              onClick={() => setTheme('dark')}
              disabled={!mounted}
              aria-label="Switch to dark mode"
            >
              <IconMoon className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={activeTheme === 'system' ? 'default' : 'ghost'}
              className="h-7 w-full rounded-lg"
              onClick={() => setTheme('system')}
              disabled={!mounted}
              aria-label="Switch to system theme"
            >
              <IconDeviceDesktop className="size-4" />
            </Button>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/settings')}>
          <IconSettings />
          Profile settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSignOut}>
          <IconLogout />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
