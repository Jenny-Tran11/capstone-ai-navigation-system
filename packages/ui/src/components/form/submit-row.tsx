import { Loader2 } from 'lucide-react';
import { Button } from '../../primitives/button';

export interface SubmitRowProps {
  isPending?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  destructive?: boolean;
}

export function SubmitRow({
  isPending = false,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  onCancel,
  destructive = false,
}: SubmitRowProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        type="submit"
        variant={destructive ? 'destructive' : 'default'}
        disabled={isPending}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  );
}
