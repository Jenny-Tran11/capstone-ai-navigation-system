import {
  createPermission,
  deletePermission,
  getPermissionsForOwnerId,
} from '@baseline/client-api/permission';
import { getRequestHandler } from '@baseline/client-api/request-handler';
import {
  type AdminUserProfile,
  deleteAdminUser,
  getAdminUserDetail,
} from '@baseline/client-api/user-profile-admin';
import { Badge } from '@baseline/ui/primitives/badge';
import { Button } from '@baseline/ui/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@baseline/ui/primitives/card';
import { Input } from '@baseline/ui/primitives/input';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageContent from '../../../components/page-content/PageContent';

export default function UserDetailAdminPage(): JSX.Element {
  const { userId = '' } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUserProfile | null>(null);
  const [workspaceId, setWorkspaceId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUserDetail(getRequestHandler(), userId);
      const permissions = await getPermissionsForOwnerId(
        getRequestHandler(),
        userId,
      );
      setUser({ ...data, permissions });
    } catch {
      setError('Failed to load user details.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasSuper = useMemo(
    () => (user?.permissions ?? []).some((p) => p.type === 'SUPER'),
    [user],
  );

  const grantSuper = async () => {
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      await createPermission(getRequestHandler(), {
        ownerId: userId,
        type: 'SUPER',
      });
      await load();
    } catch {
      setError('Failed to grant SUPER permission.');
    } finally {
      setSaving(false);
    }
  };

  const grantWorkspace = async () => {
    if (!userId || !workspaceId.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createPermission(getRequestHandler(), {
        ownerId: userId,
        type: 'WORKSPACE',
        value: workspaceId.trim(),
      });
      setWorkspaceId('');
      await load();
    } catch {
      setError('Failed to grant WORKSPACE permission.');
    } finally {
      setSaving(false);
    }
  };

  const revokePermission = async (permissionId: string) => {
    setSaving(true);
    setError(null);
    try {
      await deletePermission(getRequestHandler(), permissionId);
      await load();
    } catch {
      setError('Failed to revoke permission.');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    if (!userId || !confirm('Delete this user profile and all permissions?'))
      return;
    setSaving(true);
    setError(null);
    try {
      await deleteAdminUser(getRequestHandler(), userId);
      navigate('/users');
    } catch {
      setError('Failed to delete user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContent
      breadcrumbs={[
        { label: 'Home', href: '/dashboard' },
        { label: 'Users', href: '/users' },
        { label: userId || 'Detail' },
      ]}
    >
      <div className="flex w-full flex-col gap-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="font-semibold text-3xl tracking-tight">
              User details
            </h1>
            <p className="text-muted-foreground text-sm">
              Review identity and access, then manage permissions safely.
            </p>
            {!loading && user ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {hasSuper ? 'SUPER' : 'STANDARD'}
                </Badge>
                <Badge variant="outline" className="font-normal">
                  {(user.permissions ?? []).length} permission
                  {(user.permissions ?? []).length === 1 ? '' : 's'}
                </Badge>
              </div>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to={`/users/${userId}/edit`}>Edit</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/users">Back</Link>
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : null}
        {error ? <div className="text-sm text-destructive">{error}</div> : null}

        {!loading && user ? (
          <div className="grid gap-4 lg:grid-cols-[1.3fr,1fr]">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Core identity information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/25 p-3">
                  <div className="text-muted-foreground text-xs">User ID</div>
                  <div className="mt-1 break-all font-mono text-sm">
                    {user.userId}
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/25 p-3">
                  <div className="text-muted-foreground text-xs">
                    Display name
                  </div>
                  <div className="mt-1 font-medium">
                    {user.displayName || '(no name)'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Grant access</CardTitle>
                <CardDescription>
                  Add SUPER or WORKSPACE permission
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  size="sm"
                  disabled={saving || hasSuper}
                  onClick={() => void grantSuper()}
                >
                  {hasSuper ? 'Already SUPER' : 'Grant SUPER'}
                </Button>
                <div className="flex gap-2">
                  <Input
                    value={workspaceId}
                    onChange={(e) => setWorkspaceId(e.target.value)}
                    placeholder="workspace id"
                  />
                  <Button
                    size="sm"
                    disabled={saving || !workspaceId.trim()}
                    onClick={() => void grantWorkspace()}
                  >
                    Grant
                  </Button>
                </div>
                <div className="border-t pt-3">
                  <p className="mb-2 text-muted-foreground text-xs">
                    Dangerous action
                  </p>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={saving}
                    onClick={() => void deleteUser()}
                  >
                    Delete user
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {!loading && user ? (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Current access assignments for this user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(user.permissions ?? []).length === 0 ? (
                <div className="rounded-md border border-dashed p-3 text-muted-foreground text-sm">
                  No permissions assigned yet.
                </div>
              ) : (
                (user.permissions ?? []).map((permission) => (
                  <div
                    key={permission.permissionId}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{permission.type}</Badge>
                        {permission.value ? (
                          <span className="text-muted-foreground text-sm">
                            {permission.value}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                        {permission.permissionId}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={saving}
                      onClick={() =>
                        void revokePermission(permission.permissionId)
                      }
                    >
                      Revoke
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PageContent>
  );
}
