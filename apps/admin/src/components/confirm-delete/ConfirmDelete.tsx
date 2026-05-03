import { cn } from '@baseline/ui';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@baseline/ui/primitives/alert-dialog';
import { Button } from '@baseline/ui/primitives/button';
import { Input } from '@baseline/ui/primitives/input';
import { Label } from '@baseline/ui/primitives/label';
import type React from 'react';
import { useState } from 'react';

interface Props {
  itemName: string;
  deleteFunction(this: void): Promise<void>;
  deleteString?: string;
  buttonProps?: React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >;
}

const ConfirmDelete = (props: Props): JSX.Element => {
  const {
    itemName,
    deleteFunction,
    deleteString = itemName,
    buttonProps,
  } = props;

  const {
    className: triggerClassName,
    onClick: triggerOnClick,
    ...restTriggerProps
  } = buttonProps ?? {};

  const [isOpen, setIsOpen] = useState(false);
  const [deleteType, setDeleteType] = useState('');
  const [isPending, setIsPending] = useState(false);

  const reset = () => {
    setDeleteType('');
    setIsPending(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (isPending && !open) return;
    setIsOpen(open);
    if (!open) reset();
  };

  const handleDelete = async (): Promise<void> => {
    setIsPending(true);
    try {
      await deleteFunction();
      setIsOpen(false);
      reset();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'text-destructive hover:bg-destructive/10 hover:text-destructive',
            triggerClassName,
          )}
          {...restTriggerProps}
          onClick={(e) => {
            triggerOnClick?.(e);
          }}
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
          <Label htmlFor="delete">
            Please type{' '}
            <span className="font-medium text-foreground">{deleteString}</span>{' '}
            to confirm deletion.
          </Label>
          <Input
            id="delete"
            name="delete"
            autoComplete="off"
            placeholder={deleteString}
            value={deleteType}
            onChange={(e) => setDeleteType(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={deleteString !== deleteType || isPending}
            onClick={() => {
              void handleDelete();
            }}
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDelete;
