import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../primitives/alert-dialog';
import { Input } from '../../primitives/input';

export interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'default';
  onConfirm: () => Promise<void> | void;
  requireTyped?: string;
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  requireTyped,
}: ConfirmModalProps) {
  const [typedValue, setTypedValue] = React.useState('');
  const [isPending, setIsPending] = React.useState(false);

  const isConfirmDisabled = requireTyped ? typedValue !== requireTyped : false;

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      await onConfirm();
    } finally {
      setIsPending(false);
      setTypedValue('');
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isPending) {
      if (!nextOpen) setTypedValue('');
      onOpenChange(nextOpen);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {requireTyped && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Type{' '}
              <span className="font-mono font-medium text-foreground">
                {requireTyped}
              </span>{' '}
              to confirm.
            </p>
            <Input
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={requireTyped}
              autoComplete="off"
            />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isConfirmDisabled || isPending}
            className={
              variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : undefined
            }
          >
            {isPending ? 'Please wait…' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
