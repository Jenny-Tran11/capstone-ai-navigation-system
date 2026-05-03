import type { Table } from '@tanstack/react-table';
import { X } from 'lucide-react';
import type * as React from 'react';
import { Button } from '../../primitives/button';
import { Input } from '../../primitives/input';
import { DataTableFacetedFilter } from './data-table-faceted-filter';
import { DataTableViewOptions } from './data-table-view-options';

export interface DataTableFilter {
  column: string;
  title: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchColumn?: string;
  filters?: DataTableFilter[];
  showViewOptions?: boolean;
  actions?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  searchColumn,
  filters,
  showViewOptions = true,
  actions,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {searchColumn && (
          <Input
            placeholder="Search..."
            value={
              (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ''
            }
            onChange={(event) =>
              table.getColumn(searchColumn)?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}
        {filters?.map((filter) => (
          <DataTableFacetedFilter
            key={filter.column}
            column={table.getColumn(filter.column)}
            title={filter.title}
            options={filter.options}
          />
        ))}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {actions}
        {showViewOptions && <DataTableViewOptions table={table} />}
      </div>
    </div>
  );
}
