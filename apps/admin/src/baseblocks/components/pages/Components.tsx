import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@baseline/ui/primitives/alert-dialog';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@baseline/ui/primitives/dropdown-menu';
import { Input } from '@baseline/ui/primitives/input';
import { Label } from '@baseline/ui/primitives/label';
import { Progress } from '@baseline/ui/primitives/progress';
import { Separator } from '@baseline/ui/primitives/separator';
import { Skeleton } from '@baseline/ui/primitives/skeleton';
import { Switch } from '@baseline/ui/primitives/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@baseline/ui/primitives/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@baseline/ui/primitives/tabs';
import { Textarea } from '@baseline/ui/primitives/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@baseline/ui/primitives/tooltip';
import {
  IconAlertTriangle,
  IconBell,
  IconCheck,
  IconCopy,
  IconDotsVertical,
  IconLayoutGrid,
  IconSparkles,
} from '@tabler/icons-react';
import type React from 'react';
import { useState } from 'react';
import PageContent from '../../../components/page-content/PageContent';

interface ShowcaseSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  id?: string;
}

function ShowcaseSection({
  id,
  title,
  description,
  children,
}: ShowcaseSectionProps) {
  return (
    <section id={id} className="space-y-4">
      <div>
        <h2 className="font-semibold text-xl tracking-tight">{title}</h2>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      <Card>
        <CardContent className="space-y-6 py-6">{children}</CardContent>
      </Card>
    </section>
  );
}

const Components = (): JSX.Element => {
  const [switchOn, setSwitchOn] = useState(false);
  const [progress, setProgress] = useState(64);

  return (
    <PageContent
      breadcrumbs={[
        { label: 'Home', href: '/dashboard' },
        { label: 'Components' },
      ]}
    >
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">
            Components
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            A live showcase of the{' '}
            <span className="font-medium text-foreground">@baseline/ui</span>{' '}
            primitives used across the admin console.
          </p>
        </header>

        <ShowcaseSection
          title="Buttons"
          description="Variant and size combinations plus icon usage."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" variant="outline" aria-label="More">
              <IconDotsVertical />
            </Button>
            <Button disabled>Disabled</Button>
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="Badges">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline" className="gap-1">
              <IconSparkles className="size-3" /> New
            </Badge>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          title="Cards"
          description="Header, description, actions, content, and footer."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardDescription>Monthly revenue</CardDescription>
                <CardTitle className="font-semibold text-2xl">
                  $12,430
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">+4.5%</Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="font-medium">Trending up this month</div>
                <div className="text-muted-foreground">
                  Compared to last month
                </div>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Project status</CardTitle>
                <CardDescription>
                  Your launch progress across engineering, design, and docs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={progress} />
                <div className="flex items-center justify-between text-muted-foreground text-xs">
                  <span>{progress}% complete</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setProgress((p) => Math.max(0, p - 10))}
                    >
                      -10
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setProgress((p) => Math.min(100, p + 10))}
                    >
                      +10
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          title="Form inputs"
          description="Input, textarea, label, switch."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="demo-email">Email</Label>
              <Input
                id="demo-email"
                type="email"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-note">Notes</Label>
              <Textarea
                id="demo-note"
                placeholder="Write a short note…"
                rows={3}
              />
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <Switch
              id="demo-switch"
              checked={switchOn}
              onCheckedChange={setSwitchOn}
            />
            <Label htmlFor="demo-switch" className="text-foreground">
              Notifications {switchOn ? 'enabled' : 'disabled'}
            </Label>
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="Tabs" description="Simple segmented control.">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
            <TabsContent
              value="overview"
              className="mt-4 text-muted-foreground text-sm"
            >
              A quick summary of the most important signals.
            </TabsContent>
            <TabsContent
              value="analytics"
              className="mt-4 text-muted-foreground text-sm"
            >
              Drill into traffic, conversion, and retention metrics.
            </TabsContent>
            <TabsContent
              value="reports"
              className="mt-4 text-muted-foreground text-sm"
            >
              Download the latest scheduled reports.
            </TabsContent>
          </Tabs>
        </ShowcaseSection>

        <ShowcaseSection
          title="Table"
          description="With avatar, badge, and row actions."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="hidden sm:table-cell">Role</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="w-0 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  name: 'Ada Lovelace',
                  email: 'ada@example.com',
                  role: 'Admin',
                  status: 'Active',
                },
                {
                  name: 'Grace Hopper',
                  email: 'grace@example.com',
                  role: 'Admin',
                  status: 'Active',
                },
                {
                  name: 'Alan Turing',
                  email: 'alan@example.com',
                  role: 'Viewer',
                  status: 'Pending',
                },
              ].map((row) => (
                <TableRow key={row.email}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {row.name
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{row.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {row.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">
                    {row.role}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant={
                        row.status === 'Active' ? 'outline' : 'secondary'
                      }
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="size-8">
                          <IconDotsVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <IconCopy />
                          Copy email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <IconAlertTriangle />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ShowcaseSection>

        <ShowcaseSection
          title="Dialogs"
          description="Alert dialog with destructive action."
        >
          <div className="flex flex-wrap gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Open alert dialog</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone and will remove associated
                    data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline">
                  <IconBell />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Notifications</TooltipContent>
            </Tooltip>
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="Loading states">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Button size="sm" variant="outline" disabled>
                <IconCheck />
                Loading…
              </Button>
            </div>
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="Icon library">
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            <IconLayoutGrid className="size-6" />
            <IconSparkles className="size-6" />
            <IconBell className="size-6" />
            <IconAlertTriangle className="size-6" />
            <IconCheck className="size-6" />
            <IconCopy className="size-6" />
          </div>
          <p className="text-muted-foreground text-xs">
            Icons from{' '}
            <span className="font-mono text-foreground">
              @tabler/icons-react
            </span>
            .
          </p>
        </ShowcaseSection>
      </div>
    </PageContent>
  );
};

export default Components;
