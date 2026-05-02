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
import { Input } from '@baseline/ui/primitives/input';
import { Label } from '@baseline/ui/primitives/label';

interface Props {
  setAllAdmins: React.Dispatch<React.SetStateAction<Admin[]>>;
}

const AddAdmin = (props: Props) => {
  const { setAllAdmins } = props;
  const [newEmail, setNewEmail] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggle = () => {
    setNewEmail('');
    setIsModalOpen((open) => !open);
  };

  const addUser = async (): Promise<void> => {
    const newAdmin = await createAdmin(getRequestHandler(), {
      userEmail: newEmail,
    });
    setAllAdmins((admins) => [...admins, newAdmin]);
    toggle();
  };

  return (
    <div>
      <button
        className="text-base leading-6 px-3 py-1.5 bg-transparent border border-[#bababa] cursor-pointer hover:bg-muted transition-colors"
        onClick={toggle}
      >
        Invite
      </button>
      <Dialog open={isModalOpen} onOpenChange={toggle}>
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
          <DialogFooter>
            <button
              disabled={!newEmail}
              className="text-base leading-6 px-3 py-1.5 bg-transparent border border-[#bababa] disabled:opacity-40 cursor-pointer hover:bg-muted transition-colors"
              onClick={() => { void addUser(); }}
            >
              Add
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddAdmin;
