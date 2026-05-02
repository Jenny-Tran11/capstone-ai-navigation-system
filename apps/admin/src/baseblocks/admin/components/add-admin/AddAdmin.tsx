import { createAdmin } from '@baseline/client-api/admin';
import React, { useState } from 'react';
import { getRequestHandler } from '@baseline/client-api/request-handler';
import { Admin } from '@baseline/types/admin';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@baseline/ui/primitives/dialog';
import { Button } from '@baseline/ui/primitives/button';
import { Input } from '@baseline/ui/primitives/input';
import { Label } from '@baseline/ui/primitives/label';

interface Props {
  setAllAdmins: React.Dispatch<React.SetStateAction<Admin[]>>;
}

const AddAdmin = (props: Props) => {
  const { setAllAdmins } = props;
  const [newEmail, setNewEmail] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const setModalOpen = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) setNewEmail('');
  };

  const openInvite = (): void => {
    setNewEmail('');
    setIsModalOpen(true);
  };

  const addUser = async (): Promise<void> => {
    const newAdmin = await createAdmin(getRequestHandler(), {
      userEmail: newEmail,
    });
    setAllAdmins((admins) => [...admins, newAdmin]);
    setModalOpen(false);
  };

  return (
    <div>
      <Button type="button" variant="outline" size="sm" onClick={openInvite}>
        Invite
      </Button>
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              onChange={(e) => setNewEmail(e.target.value)}
              value={newEmail}
              placeholder="admin@example.com"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!newEmail.trim()}
              onClick={() => {
                void addUser();
              }}
            >
              Add admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddAdmin;
