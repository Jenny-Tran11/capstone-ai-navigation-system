import { deleteDetection } from '@baseline/client-api/detection';
import { getRequestHandler } from '@baseline/client-api/request-handler';
import type { Detection } from '@baseline/types/detection';
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
import { IconDotsVertical, IconEye, IconTrash } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  detections: Detection[];
}

type RowLike<T> = { original: T };

const DetectionList = ({ detections: initial }: Props): JSX.Element => {
  const [all, setAll] = useState<Detection[]>(initial ?? []);
  const [pendingDelete, setPendingDelete] = useState<Detection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (): Promise<void> => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteDetection(getRequestHandler(), pendingDelete.detectionId);
      setAll((prev) =>
        prev.filter((d) => d.detectionId !== pendingDelete.detectionId),
      );
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo<ColumnDef<Detection, unknown>[]>(
    () => [
      {
        accessorKey: 'sceneDescription',
        header: 'Scene',
        cell: ({ row }: { row: RowLike<Detection> }) => (
          <p className="max-w-xs truncate text-sm text-foreground">
            {row.original.sceneDescription}
          </p>
        ),
      },
      {
        accessorKey: 'userId',
        header: 'User',
        meta: {
          headerClassName: 'hidden md:table-cell',
          cellClassName: 'hidden md:table-cell',
        },
        cell: ({ row }: { row: RowLike<Detection> }) => (
          <span className="font-mono text-muted-foreground text-xs">
            {row.original.userId}
          </span>
        ),
      },
      {
        id: 'objectCount',
        header: 'Objects',
        cell: ({ row }: { row: RowLike<Detection> }) => (
          <Badge variant="secondary">
            {row.original.detections?.length ?? 0}
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Time',
        meta: {
          headerClassName: 'hidden md:table-cell',
          cellClassName: 'hidden md:table-cell',
        },
        cell: ({ row }: { row: RowLike<Detection> }) => (
          <span className="text-muted-foreground text-xs">
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleString()
              : '—'}
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
        cell: ({ row }: { row: RowLike<Detection> }) => {
          const d = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Actions"
                >
                  <IconDotsVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link
                    to={`/detections/${d.detectionId}`}
                    className="flex items-center gap-2"
                  >
                    <IconEye className="size-4" />
                    View details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => setPendingDelete(d)}
                >
                  <IconTrash />
                  Delete
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
            Detections
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            All obstacle detection events recorded by users.
          </p>
        </div>
      </header>

      <EntityList
        title="All detections"
        description={`${all.length} record${all.length === 1 ? '' : 's'}`}
        columns={columns}
        data={all}
        searchColumn="sceneDescription"
        emptyMessage="No detections recorded yet."
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
            <AlertDialogTitle>Delete detection record?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the detection record. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DetectionList;
