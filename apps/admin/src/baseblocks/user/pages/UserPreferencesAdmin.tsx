import { getRequestHandler } from '@baseline/client-api/request-handler';
import {
  type AdminUserProfile,
  getAdminUserProfiles,
  inviteAdminUser,
} from '@baseline/client-api/user-profile-admin';
import { type ColumnDef, EntityList } from '@baseline/ui';
import { Badge } from '@baseline/ui/primitives/badge';
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
import { IconExternalLink, IconUser } from '@tabler/icons-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContent from '../../../components/page-content/PageContent';

export default function UserPreferencesAdminPage(): JSX.Element {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<AdminUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSuper, setInviteSuper] = useState(true);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUserProfiles(getRequestHandler());
      setProfiles(data);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  const invite = useCallback(async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setInviting(true);
    setError(null);
    try {
      await inviteAdminUser(getRequestHandler(), {
        email,
        grantSuper: inviteSuper,
      });
      setInviteEmail('');
      await loadProfiles();
      setInviteOpen(false);
    } catch {
      setError('Failed to invite user.');
    } finally {
      setInviting(false);
    }
  }, [inviteEmail, inviteSuper, loadProfiles]);

  const columns = useMemo<ColumnDef<AdminUserProfile, unknown>[]>(
    () => [
      {
        accessorKey: 'displayName',
        header: 'User',
        cell: ({ row }: { row: { original: AdminUserProfile } }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <IconUser className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-sm">
                  {user.displayName || '(no name)'}
                </p>
                <p className="truncate font-mono text-muted-foreground text-xs">
                  {user.userId}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'permissions',
        header: 'Permissions',
        cell: ({ row }: { row: { original: AdminUserProfile } }) => {
          const permissionTypes = row.original.permissionTypes ?? [];
          if (!permissionTypes.length) {
            return (
              <Badge variant="outline" className="font-normal">
                None
              </Badge>
            );
          }
          return (
            <div className="flex flex-wrap gap-1">
              {permissionTypes.map((type) => (
                <Badge key={type} variant="outline" className="font-normal">
                  {type}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        enableHiding: false,
        meta: {
          headerClassName: 'w-0 pr-6 text-right',
          cellClassName: 'w-0 text-right pr-6',
        },
        cell: ({ row }: { row: { original: AdminUserProfile } }) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/users/${row.original.userId}/edit`)}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => navigate(`/users/${row.original.userId}`)}
              aria-label="Open user details"
            >
              <IconExternalLink className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  return (
    <PageContent
      breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Users' }]}
    >
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">
            Users
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Manage invited users and open dedicated details/edit pages.
          </p>
        </header>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading users…</div>
        ) : null}
        {error ? <div className="text-sm text-destructive">{error}</div> : null}

        <EntityList
          title={
            <span className="inline-flex items-center gap-2">
              <IconUser className="size-5 text-muted-foreground" />
              All users
            </span>
          }
          description={`${profiles.length} user${profiles.length === 1 ? '' : 's'}`}
          columns={columns}
          data={profiles}
          searchColumn="displayName"
          emptyMessage="No users yet — invite the first user."
          showViewOptions={false}
          createAction={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInviteOpen(true)}
            >
              Invite
            </Button>
          }
        />
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite user</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={inviteSuper}
                onChange={(e) => setInviteSuper(e.target.checked)}
              />
              Grant SUPER permission on invite
            </label>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={inviting}
              onClick={() => setInviteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={inviting || !inviteEmail.trim()}
              onClick={() => void invite()}
            >
              {inviting ? 'Inviting…' : 'Invite user'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContent>
  );
}
