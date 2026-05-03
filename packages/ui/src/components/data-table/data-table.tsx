import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import * as React from 'react';
import { cn } from '../../lib/utils';
import { Skeleton } from '../../primitives/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../primitives/table';
import { DataTablePagination } from './data-table-pagination';
import { type DataTableFilter, DataTableToolbar } from './data-table-toolbar';

export type { DataTableFilter };

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchColumn?: string;
  filters?: DataTableFilter[];
  showViewOptions?: boolean;
  loading?: boolean;
  pageCount?: number;
  onPaginationChange?: (pagination: PaginationState) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onFiltersChange?: (filters: ColumnFiltersState) => void;
  emptyMessage?: string;
  toolbarActions?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchColumn,
  filters,
  showViewOptions = true,
  loading = false,
  pageCount,
  onPaginationChange,
  onSortingChange,
  onFiltersChange,
  emptyMessage = 'No results.',
  toolbarActions,
}: DataTableProps<TData, TValue>) {
  const isServerSide = pageCount !== undefined;

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    ...(isServerSide
      ? {
          pageCount,
          manualPagination: true,
          manualSorting: true,
          manualFiltering: true,
        }
      : {}),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    onSortingChange: (updater) => {
      setSorting(updater);
      if (onSortingChange) {
        const next = typeof updater === 'function' ? updater(sorting) : updater;
        onSortingChange(next);
      }
    },
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      if (onFiltersChange) {
        const next =
          typeof updater === 'function' ? updater(columnFilters) : updater;
        onFiltersChange(next);
      }
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      setPagination(updater);
      if (onPaginationChange) {
        const next =
          typeof updater === 'function' ? updater(pagination) : updater;
        onPaginationChange(next);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        searchColumn={searchColumn}
        filters={filters}
        showViewOptions={showViewOptions}
        actions={toolbarActions}
      />
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-muted/30 hover:bg-muted/30"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={
                      (
                        header.column.columnDef.meta as
                          | { headerClassName?: string }
                          | undefined
                      )?.headerClassName
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows have no identity
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton cells have no identity
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        (
                          cell.column.columnDef.meta as
                            | { cellClassName?: string }
                            | undefined
                        )?.cellClassName,
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
