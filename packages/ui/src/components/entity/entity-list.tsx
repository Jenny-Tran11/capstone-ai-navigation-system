import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTableFilter } from '../data-table/data-table';

export interface EntityListProps<TData, TValue> {
  title: React.ReactNode;
  description?: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  createAction?: React.ReactNode;
  searchColumn?: string;
  filters?: DataTableFilter[];
  emptyMessage?: string;
  /** Forwarded to underlying DataTable — hide column visibility menu. */
  showViewOptions?: boolean;
  toolbarActions?: React.ReactNode;
}

export function EntityList<TData, TValue>({
  title,
  description,
  columns,
  data,
  loading = false,
  createAction,
  searchColumn,
  filters,
  emptyMessage,
  showViewOptions,
  toolbarActions,
}: EntityListProps<TData, TValue>) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {createAction && (
          <div className="flex shrink-0 items-center gap-2">{createAction}</div>
        )}
      </div>
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        searchColumn={searchColumn}
        filters={filters}
        emptyMessage={emptyMessage}
        showViewOptions={showViewOptions}
        toolbarActions={toolbarActions}
      />
    </div>
  );
}
