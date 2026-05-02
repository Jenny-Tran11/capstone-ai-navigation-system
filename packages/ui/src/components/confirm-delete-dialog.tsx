'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../primitives/alert-dialog';
import { Button } from '../primitives/button';
import { Input } from '../primitives/input';
import { Label } from '../primitives/label';
import { cn } from '../lib/utils';

export interface ConfirmDeleteDialogProps {
  itemName: string;
  onConfirm(): Promise<void>;
  deleteString?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerClassName?: string;
  triggerProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

export function ConfirmDeleteDialog({
  itemName,
  onConfirm,
  deleteString,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  triggerClassName,
  triggerProps,
}: ConfirmDeleteDialogProps) {
  const confirmString = deleteString ?? itemName;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [typed, setTyped] = React.useState('');
  const [isPending, setIsPending] = React.useState(false);

  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;

  const handleOpenChange = (next: boolean) => {
    if (isPending && !next) return;
    if (!isControlled) setInternalOpen(next);
    onOpenChangeProp?.(next);
    if (!next) setTyped('');
  };

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      await onConfirm();
      handleOpenChange(false);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'text-destructive hover:bg-destructive/10 hover:text-destructive',
            triggerClassName,
          )}
          {...triggerProps}
        >
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{itemName}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="confirm-delete-input">
            Type{' '}
            <span className="font-medium text-foreground">{confirmString}</span>{' '}
            to confirm.
          </Label>
          <Input
            id="confirm-delete-input"
            autoComplete="off"
            placeholder={confirmString}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={typed !== confirmString || isPending}
            onClick={() => void handleConfirm()}
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
