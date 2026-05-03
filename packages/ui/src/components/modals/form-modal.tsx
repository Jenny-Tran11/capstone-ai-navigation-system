import { Loader2 } from 'lucide-react';
import type * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../../primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../primitives/dialog';
import type { ModalSize } from './modal';

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
};

export interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: ModalSize;
  title: string;
  description?: string;
  onSubmit: () => Promise<void> | void;
  isPending?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormModal({
  open,
  onOpenChange,
  size = 'md',
  title,
  description,
  onSubmit,
  isPending = false,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  children,
  className,
}: FormModalProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!isPending) onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn(sizeClasses[size], className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="contents">
          {children}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
