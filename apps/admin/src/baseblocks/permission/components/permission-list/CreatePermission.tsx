import { createPermission } from '@baseline/client-api/permission';
import { getRequestHandler } from '@baseline/client-api/request-handler';
import { useAdmins } from '@baseline/swr-client/admin';
import { useWorkspaces } from '@baseline/swr-client/workspace';
import type { Permission, PermissionType } from '@baseline/types/permission';
import { Button } from '@baseline/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@baseline/ui/primitives/dialog';
import { Label } from '@baseline/ui/primitives/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@baseline/ui/primitives/select';
import type React from 'react';
import { useState } from 'react';

interface Props {
  setPermissions: React.Dispatch<React.SetStateAction<Permission[]>>;
}

const CreatePermission = ({ setPermissions }: Props) => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<PermissionType>('SUPER');
  const [ownerId, setOwnerId] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [isPending, setIsPending] = useState(false);

  const { admins } = useAdmins();
  const { workspaces } = useWorkspaces();

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setType('SUPER');
      setOwnerId('');
      setWorkspaceId('');
    }
  };

  const handleCreate = async (): Promise<void> => {
    setIsPending(true);
    try {
      const permission = await createPermission(getRequestHandler(), {
        type,
        value: type === 'WORKSPACE' ? workspaceId : undefined,
        ownerId,
      });
      setPermissions((prev) => [...prev, permission]);
      handleClose(false);
    } finally {
      setIsPending(false);
    }
  };

  const isValid = ownerId && (type === 'SUPER' || workspaceId);

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Grant
      </Button>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant permission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>User</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user…" />
                </SelectTrigger>
                <SelectContent>
                  {(admins ?? []).map((admin) => (
                    <SelectItem key={admin.userSub} value={admin.userSub}>
                      {admin.userEmail}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v as PermissionType);
                  setWorkspaceId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER">SUPER</SelectItem>
                  <SelectItem value="WORKSPACE">WORKSPACE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === 'WORKSPACE' && (
              <div className="space-y-2">
                <Label>Workspace</Label>
                <Select value={workspaceId} onValueChange={setWorkspaceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a workspace…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(workspaces ?? []).map((ws) => (
                      <SelectItem key={ws.workspaceId} value={ws.workspaceId}>
                        {ws.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
              disabled={!isValid || isPending}
              onClick={() => void handleCreate()}
            >
              {isPending ? 'Granting…' : 'Grant permission'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreatePermission;
