import { getRequestHandler } from '@baseline/client-api/request-handler';
import { createWorkspace } from '@baseline/client-api/workspace';
import type { Workspace } from '@baseline/types/workspace';
import { Button } from '@baseline/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@baseline/ui/primitives/dialog';
import { Input } from '@baseline/ui/primitives/input';
import { Label } from '@baseline/ui/primitives/label';
import type React from 'react';
import { useState } from 'react';

interface Props {
  setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
}

const CreateWorkspace = ({ setWorkspaces }: Props) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPending, setIsPending] = useState(false);

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setName('');
      setDescription('');
    }
  };

  const handleCreate = async (): Promise<void> => {
    setIsPending(true);
    try {
      const workspace = await createWorkspace(getRequestHandler(), {
        name,
        description: description || undefined,
      });
      setWorkspaces((prev) => [...prev, workspace]);
      handleClose(false);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Create
      </Button>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My workspace"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleClose(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!name.trim() || isPending}
              onClick={() => void handleCreate()}
            >
              {isPending ? 'Creating…' : 'Create workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateWorkspace;
