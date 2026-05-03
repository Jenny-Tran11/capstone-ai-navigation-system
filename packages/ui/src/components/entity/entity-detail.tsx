import type * as React from 'react';
import { cn } from '../../lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../primitives/card';

export interface EntityField {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  span?: 1 | 2;
}

export interface EntityDetailProps {
  title: string;
  description?: string;
  fields: EntityField[];
  actions?: React.ReactNode;
}

export function EntityDetail({
  title,
  description,
  fields,
  actions,
}: EntityDetailProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div
              key={field.label}
              className={cn(
                'flex flex-col gap-1',
                field.span === 2 && 'sm:col-span-2',
              )}
            >
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {field.label}
              </dt>
              <dd className={cn('text-sm', field.mono && 'font-mono text-xs')}>
                {field.value ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
