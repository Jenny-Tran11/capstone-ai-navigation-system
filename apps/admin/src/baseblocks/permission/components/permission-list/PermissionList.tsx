import { deletePermission } from '@baseline/client-api/permission';
import { getRequestHandler } from '@baseline/client-api/request-handler';
import type { Permission } from '@baseline/types/permission';
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
import { Badge } from '@baseline/ui/primitives/badge';
import { Button } from '@baseline/ui/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@baseline/ui/primitives/dropdown-menu';
import { IconDotsVertical, IconKey, IconTrash } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import CreatePermission from './CreatePermission';

interface Props {
  permissions: Permission[];
}

type RowLike<T> = { original: T };

const PermissionList = ({ permissions: initial }: Props): JSX.Element => {
  const [allPermissions, setAllPermissions] = useState<Permission[]>(
    initial ?? [],
  );
  const [pendingDelete, setPendingDelete] = useState<Permission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (): Promise<void> => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deletePermission(getRequestHandler(), pendingDelete.permissionId);
      setAllPermissions((prev) =>
        prev.filter((p) => p.permissionId !== pendingDelete.permissionId),
      );
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo<ColumnDef<Permission, unknown>[]>(
    () => [
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }: { row: RowLike<Permission> }) => (
          <Badge
            variant={row.original.type === 'SUPER' ? 'default' : 'secondary'}
          >
            {row.original.type}
          </Badge>
        ),
      },
      {
        accessorKey: 'ownerId',
        header: 'Owner',
        cell: ({ row }: { row: RowLike<Permission> }) => (
          <span className="font-mono text-muted-foreground text-xs">
            {row.original.ownerId}
          </span>
        ),
      },
      {
        accessorKey: 'compositeKey',
        header: 'Composite key',
        meta: {
          headerClassName: 'hidden md:table-cell',
          cellClassName: 'hidden md:table-cell',
        },
        cell: ({ row }: { row: RowLike<Permission> }) => (
          <span className="font-mono text-muted-foreground text-xs">
            {row.original.compositeKey}
          </span>
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
        cell: ({ row }: { row: RowLike<Permission> }) => {
          const permission = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Permission actions"
                >
                  <IconDotsVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => setPendingDelete(permission)}
                >
                  <IconTrash />
                  Revoke permission
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">
            Permissions
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Manage access permissions for users across workspaces.
          </p>
        </div>
      </header>

      <EntityList
        title={
          <span className="inline-flex items-center gap-2">
            <IconKey className="size-5 text-muted-foreground" />
            All permissions
          </span>
        }
        description={`${allPermissions.length} permission${allPermissions.length === 1 ? '' : 's'}`}
        columns={columns}
        data={allPermissions}
        searchColumn="ownerId"
        createAction={<CreatePermission setPermissions={setAllPermissions} />}
        emptyMessage="No permissions yet."
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
            <AlertDialogTitle>Revoke permission?</AlertDialogTitle>
            <AlertDialogDescription>
              This revokes {pendingDelete?.type} access
              {pendingDelete?.value ? ` for ${pendingDelete.value}` : ''}.
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
              {isDeleting ? 'Revoking…' : 'Revoke permission'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PermissionList;
