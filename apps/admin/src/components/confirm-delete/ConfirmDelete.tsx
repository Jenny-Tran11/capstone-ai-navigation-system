import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@baseline/ui/primitives/dialog';
import { Input } from '@baseline/ui/primitives/input';
import { Label } from '@baseline/ui/primitives/label';

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggle = () => setIsModalOpen((open) => !open);
  const [deleteType, setDeleteType] = useState('');

  const handleDelete = async (): Promise<void> => {
    toggle();
    setDeleteType('');
    await deleteFunction();
  };

  return (
    <div className="flex items-center">
      <button
        {...buttonProps}
        onClick={toggle}
        className="flex items-center font-normal text-[15px] leading-[22px] font-['Montserrat',sans-serif] bg-transparent border-0 cursor-pointer disabled:opacity-25"
      >
        Delete
      </button>
      <Dialog open={isModalOpen} onOpenChange={toggle}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &quot;{itemName}&quot;?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete">
              Please type <b>{deleteString}</b> to confirm deletion
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
          <DialogFooter>
            <button
              disabled={deleteString !== deleteType}
              onClick={() => { void handleDelete(); }}
              className="flex items-center font-normal text-[15px] leading-[22px] font-['Montserrat',sans-serif] bg-transparent border-0 cursor-pointer disabled:opacity-25"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConfirmDelete;
