import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllAdmins } from '@baseline/client-api/admin';
import { getRequestHandler } from '@baseline/client-api/request-handler';
import {
  IconArrowRight,
  IconDotsVertical,
  IconLayoutGrid,
  IconMail,
  IconServer,
  IconShieldCheck,
  IconSparkles,
  IconTrendingUp,
  IconUsers,
} from '@tabler/icons-react';
import { Avatar, AvatarFallback } from '@baseline/ui/primitives/avatar';
import { Badge } from '@baseline/ui/primitives/badge';
import { Button } from '@baseline/ui/primitives/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@baseline/ui/primitives/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@baseline/ui/primitives/dropdown-menu';
import { Separator } from '@baseline/ui/primitives/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@baseline/ui/primitives/table';

type Tone = 'default' | 'muted' | 'positive';

type StatCardItem = {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  label: React.ReactNode;
  value: React.ReactNode;
  hint: React.ReactNode;
  tone?: Tone;
  trend?: { direction: 'up' | 'down' | 'flat'; label: string };
};

function greetingForHour(date: Date): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function shortUrl(url: string): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname === '/' ? '' : u.pathname}`;
  } catch {
    return url.length > 42 ? `${url.slice(0, 40)}…` : url;
  }
}

function inferEnvLabel(apiUrl: string): string {
  const lower = apiUrl.toLowerCase();
  if (lower.includes('localhost') || lower.includes('127.0.0.1'))
    return 'Local';
  if (lower.includes('staging')) return 'Staging';
  if (!apiUrl) return 'Unknown';
  return 'Remote';
}

const DashboardContent = (): JSX.Element => {
  const [adminCount, setAdminCount] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(now);

  const apiUrl =
    typeof process.env.REACT_APP_API_URL === 'string'
      ? process.env.REACT_APP_API_URL.trim()
      : '';
  const appName =
    typeof process.env.REACT_APP_APP_NAME === 'string'
      ? process.env.REACT_APP_APP_NAME.trim()
      : 'Baseline Core';

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rh = getRequestHandler();
        if (!rh) {
          if (!cancelled) setAdminCount(null);
          return;
        }
        const list = await getAllAdmins(rh);
        if (!cancelled) {
          setAdminCount(list.length);
          setLoadError(null);
        }
      } catch {
        if (!cancelled) {
          setAdminCount(null);
          setLoadError('Unable to load admin count.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats: StatCardItem[] = [
    {
      key: 'admins',
      icon: IconUsers,
      label: 'Admin users',
      value: adminCount !== null ? String(adminCount) : '—',
      hint: loadError ?? 'From GET /admin/list',
      tone: 'default',
    },
    {
      key: 'api',
      icon: IconServer,
      label: 'API URL',
      value: shortUrl(apiUrl) || '—',
      hint: apiUrl ? 'Configured in env' : 'Set REACT_APP_API_URL',
      tone: apiUrl ? 'default' : 'muted',
    },
    {
      key: 'env',
      icon: IconShieldCheck,
      label: 'Environment',
      value: inferEnvLabel(apiUrl),
      hint: 'Inferred from API URL',
      tone: 'default',
    },
    {
      key: 'status',
      icon: IconLayoutGrid,
      label: 'Status',
      value: 'Active',
      hint: 'Authenticated session',
      tone: 'positive',
      trend: { direction: 'up', label: 'Healthy' },
    },
  ];

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-muted-foreground text-xs shadow-sm">
            <IconSparkles className="size-3.5 shrink-0" aria-hidden />
            Admin console
          </div>
          <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">
            {greetingForHour(now)}
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Signed-in overview for{' '}
            <span className="font-medium text-foreground">{appName}</span>. Use
            the quick actions to manage admins or your profile.
          </p>
        </div>
        <p className="shrink-0 text-muted-foreground text-sm tabular-nums">
          {dateLabel}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        {stats.map((stat) => (
          <StatCard key={stat.key} {...stat} />
        ))}
      </section>

      <Separator />

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <IconLayoutGrid className="size-5 text-muted-foreground" />
              Quick actions
            </CardTitle>
            <CardDescription>
              Jump to common tasks — same routes as in the sidebar.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <ActionTile
              to="/admins"
              title="Manage admins"
              description="Invite or remove administrators."
              icon={IconUsers}
            />
            <ActionTile
              to="/components"
              title="Components"
              description="Browse the @baseline/ui primitives."
              icon={IconLayoutGrid}
            />
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl">Team members</CardTitle>
            <CardDescription>
              Invite your team members to collaborate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Toby Belhome', email: 'contact@bundui.io', role: 'Viewer' },
              { name: 'Jackson Lee', email: 'pre@example.com', role: 'Developer' },
              { name: 'Hally Gray', email: 'hally@site.com', role: 'Viewer' },
            ].map((member) => (
              <div key={member.email} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {member.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{member.name}</p>
                  <p className="truncate text-muted-foreground text-xs">{member.email}</p>
                </div>
                <Badge variant="outline">{member.role}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Latest payments</CardTitle>
            <CardDescription>
              See recent payments from your customers here.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Export
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ['Kenneth Thompson', 'ken99@yahoo.com', '$316.00', 'success'],
                ['Abraham Lincoln', 'abe45@gmail.com', '$242.00', 'success'],
                ['Monserrat Rodriguez', 'monserrat44@gmail.com', '$837.00', 'processing'],
                ['Silas Johnson', 'silas22@gmail.com', '$874.00', 'success'],
              ].map(([name, email, amount, status]) => (
                <TableRow key={String(email)}>
                  <TableCell className="pl-6 font-medium">{name}</TableCell>
                  <TableCell className="text-muted-foreground">{email}</TableCell>
                  <TableCell>{amount}</TableCell>
                  <TableCell>
                    <Badge variant={status === 'processing' ? 'secondary' : 'outline'}>
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <IconDotsVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <IconMail />
                          Open
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

function StatCard(props: StatCardItem) {
  const {
    icon: Icon,
    label,
    value,
    hint,
    tone = 'default',
    trend,
  } = props;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
          {label}
        </CardDescription>
        <CardTitle
          className={
            tone === 'muted'
              ? 'truncate font-semibold text-2xl text-muted-foreground tabular-nums tracking-tight @[250px]/card:text-3xl'
              : 'truncate font-semibold text-2xl tabular-nums tracking-tight @[250px]/card:text-3xl'
          }
        >
          {value}
        </CardTitle>
        {trend ? (
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {trend.label}
            </Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="text-muted-foreground text-xs">{hint}</div>
      </CardFooter>
    </Card>
  );
}

function ActionTile(props: {
  to: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const { to, title, description, icon: Icon } = props;
  return (
    <div className="flex flex-col justify-between rounded-lg border border-border bg-background/60 p-4 shadow-xs">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-card">
          <Icon className="size-5 text-muted-foreground" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-medium text-sm leading-tight">{title}</p>
          <p className="mt-1 text-muted-foreground text-xs leading-snug">
            {description}
          </p>
        </div>
      </div>
      <Button asChild variant="outline" size="sm" className="w-full gap-2">
        <Link to={to}>
          Open
          <IconArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

export default DashboardContent;
