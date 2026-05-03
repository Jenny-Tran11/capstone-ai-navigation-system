import { getRequestHandler } from '@baseline/client-api/request-handler';
import { deleteWorkspace } from '@baseline/client-api/workspace';
import type { Workspace } from '@baseline/types/workspace';
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
import { IconBuilding, IconDotsVertical, IconTrash } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import CreateWorkspace from './CreateWorkspace';

interface Props {
  workspaces: Workspace[];
}

type RowLike<T> = { original: T };

const WorkspaceList = ({ workspaces: initial }: Props): JSX.Element => {
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>(
    initial ?? [],
  );
  const [pendingDelete, setPendingDelete] = useState<Workspace | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (): Promise<void> => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteWorkspace(getRequestHandler(), pendingDelete.workspaceId);
      setAllWorkspaces((prev) =>
        prev.filter((w) => w.workspaceId !== pendingDelete.workspaceId),
      );
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo<ColumnDef<Workspace, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Workspace',
        cell: ({ row }: { row: RowLike<Workspace> }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <IconBuilding className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground text-sm">
                {row.original.name}
              </p>
              {row.original.description && (
                <p className="truncate text-muted-foreground text-xs">
                  {row.original.description}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'workspaceId',
        header: 'ID',
        meta: {
          headerClassName: 'hidden md:table-cell',
          cellClassName: 'hidden md:table-cell',
        },
        cell: ({ row }: { row: RowLike<Workspace> }) => (
          <span className="font-mono text-muted-foreground text-xs">
            {row.original.workspaceId}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: () => (
          <Badge variant="outline" className="font-normal">
            Active
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
        cell: ({ row }: { row: RowLike<Workspace> }) => {
          const workspace = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Actions for ${workspace.name}`}
                >
                  <IconDotsVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => setPendingDelete(workspace)}
                >
                  <IconTrash />
                  Delete workspace
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
            Workspaces
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Manage workspaces that users can belong to.
          </p>
        </div>
      </header>

      <EntityList
        title={
          <span className="inline-flex items-center gap-2">
            <IconBuilding className="size-5 text-muted-foreground" />
            All workspaces
          </span>
        }
        description={`${allWorkspaces.length} workspace${allWorkspaces.length === 1 ? '' : 's'}`}
        columns={columns}
        data={allWorkspaces}
        searchColumn="name"
        createAction={<CreateWorkspace setWorkspaces={setAllWorkspaces} />}
        emptyMessage="No workspaces yet — create the first one."
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
              Delete {pendingDelete?.name ?? 'workspace'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the workspace. Users will lose access.
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
              {isDeleting ? 'Deleting…' : 'Delete workspace'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorkspaceList;
