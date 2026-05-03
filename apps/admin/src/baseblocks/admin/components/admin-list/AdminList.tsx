import { deleteAdmin } from '@baseline/client-api/admin';
import { getRequestHandler } from '@baseline/client-api/request-handler';
import type { Admin } from '@baseline/types/admin';
import { type ColumnDef, EntityList } from '@baseline/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@baseline/ui/primitives/alert-dialog';
import { Avatar, AvatarFallback } from '@baseline/ui/primitives/avatar';
import { Badge } from '@baseline/ui/primitives/badge';
import { Button } from '@baseline/ui/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@baseline/ui/primitives/dropdown-menu';
import {
  IconCopy,
  IconDotsVertical,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react';
import { useCallback, useMemo, useState } from 'react';
import AddUser from '../add-admin/AddAdmin';

interface Props {
  admins: Admin[];
}

/** TanStack row shape — local alias so ESLint resolves types without importing react-table in admin */
type RowLike<T> = { original: T };

function initialsOf(email: string): string {
  if (!email) return 'U';
  const local = email.split('@')[0] ?? email;
  const cleaned = local.replace(/[^a-zA-Z]/g, '');
  if (!cleaned) return email.slice(0, 2).toUpperCase();
  if (cleaned.length === 1) return cleaned.toUpperCase();
  return cleaned.slice(0, 2).toUpperCase();
}

const AdminList = ({ admins }: Props): JSX.Element => {
  const [allAdmins, setAllAdmins] = useState<Admin[]>(admins ?? []);
  const [pendingDelete, setPendingDelete] = useState<Admin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleDelete = async (): Promise<void> => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteAdmin(getRequestHandler(), {
        adminId: pendingDelete.userSub,
      });
      setAllAdmins((current) =>
        current.filter((admin) => admin.userSub !== pendingDelete.userSub),
      );
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyId = useCallback(async (id: string): Promise<void> => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(id);
      }
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // no-op
    }
  }, []);

  const countLabel =
    allAdmins.length === 1
      ? '1 person in your team'
      : `${allAdmins.length} people in your team`;

  const columns = useMemo<ColumnDef<Admin, unknown>[]>(
    () => [
      {
        accessorKey: 'userEmail',
        header: 'Member',
        cell: ({ row }: { row: RowLike<Admin> }) => {
          const admin = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 rounded-full">
                <AvatarFallback className="rounded-full bg-muted font-medium text-muted-foreground text-xs">
                  {initialsOf(admin.userEmail)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground text-sm">
                  {admin.userEmail}
                </p>
                <p
                  className="truncate font-mono text-muted-foreground text-xs md:hidden"
                  title={admin.userSub}
                >
                  {admin.userSub}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'userSub',
        header: 'User ID',
        meta: {
          headerClassName: 'hidden md:table-cell',
          cellClassName: 'hidden md:table-cell',
        },
        cell: ({ row }: { row: RowLike<Admin> }) => (
          <span
            className="line-clamp-1 font-mono text-muted-foreground text-xs"
            title={row.original.userSub}
          >
            {row.original.userSub}
          </span>
        ),
      },
      {
        id: 'role',
        header: 'Role',
        cell: () => (
          <Badge variant="outline" className="font-normal">
            Admin
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        enableHiding: false,
        meta: {
          headerClassName: 'w-0 pr-6 text-right',
          cellClassName: 'w-0 text-right pr-6',
        },
        cell: ({ row }: { row: RowLike<Admin> }) => {
          const admin = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Actions for ${admin.userEmail}`}
                >
                  <IconDotsVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onSelect={() => void handleCopyId(admin.userSub)}
                >
                  <IconCopy />
                  {copiedId === admin.userSub ? 'Copied' : 'Copy user ID'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => setPendingDelete(admin)}
                >
                  <IconTrash />
                  Remove admin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [copiedId, handleCopyId],
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">
            Admin team
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Invite colleagues who should access this console. Each member has
            full admin privileges.
          </p>
        </div>
      </header>

      <EntityList
        title={
          <span className="inline-flex items-center gap-2">
            <IconUsers className="size-5 text-muted-foreground" />
            Team members
          </span>
        }
        description={countLabel}
        columns={columns}
        data={allAdmins}
        searchColumn="userEmail"
        createAction={<AddUser setAllAdmins={setAllAdmins} />}
        emptyMessage="No admins yet — use Invite to add the first one."
        showViewOptions={false}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {pendingDelete?.userEmail ?? 'admin'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This revokes admin access. You can re-invite them at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/40"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {isDeleting ? 'Removing…' : 'Remove admin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminList;
