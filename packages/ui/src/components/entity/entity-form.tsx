import * as React from 'react';
import { SubmitRow } from '../form/submit-row';

export interface EntityFormProps {
  title: string;
  description?: string;
  isPending?: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  children: React.ReactNode;
}

export function EntityForm({
  title,
  description,
  isPending = false,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  children,
}: EntityFormProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex flex-col gap-6"
      >
        {children}
        <SubmitRow
          isPending={isPending}
          submitLabel={submitLabel}
          onCancel={onCancel}
        />
      </form>
    </div>
  );
}
