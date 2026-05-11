import {
  getAdminUserDetail,
  updateAdminUserPreferences,
} from '@baseline/client-api/user-profile-admin';
import { getRequestHandler } from '@baseline/client-api/request-handler';
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
import { useCallback, useEffect, useId, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageContent from '../../../components/page-content/PageContent';

type EditablePreferences = {
  maxScansPerHour: number;
  detectionIntervalSec: number;
  speechRate: number;
  speechLanguage: string;
  verbosity: 'low' | 'medium' | 'high';
  hapticEnabled: boolean;
  emergencyContact: { name: string; phone: string };
};

function toEditablePreferences(
  raw: Record<string, unknown>,
): EditablePreferences {
  const emergency = (raw.emergencyContact ?? {}) as {
    name?: string;
    phone?: string;
  };
  return {
    maxScansPerHour: Number(raw.maxScansPerHour ?? 30),
    detectionIntervalSec: Number(raw.detectionIntervalSec ?? 10),
    speechRate: Number(raw.speechRate ?? 1),
    speechLanguage: String(raw.speechLanguage ?? 'en-AU'),
    verbosity: (raw.verbosity as EditablePreferences['verbosity']) ?? 'medium',
    hapticEnabled: Boolean(raw.hapticEnabled ?? true),
    emergencyContact: {
      name: emergency.name ?? '',
      phone: emergency.phone ?? '',
    },
  };
}

export default function UserEditAdminPage(): JSX.Element {
  const { userId = '' } = useParams();
  const [prefs, setPrefs] = useState<EditablePreferences | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const user = await getAdminUserDetail(getRequestHandler(), userId);
      setDisplayName(user.displayName || userId);
      setPrefs(toEditablePreferences(user.preferences ?? {}));
    } catch {
      setError('Failed to load user for editing.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!userId || !prefs) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateAdminUserPreferences(getRequestHandler(), {
        userId,
        preferences: prefs as unknown as Record<string, unknown>,
      });
      setSuccess('Preferences saved.');
    } catch {
      setError('Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContent
      breadcrumbs={[
        { label: 'Home', href: '/dashboard' },
        { label: 'Users', href: '/users' },
        { label: userId || 'User' },
        { label: 'Edit' },
      ]}
    >
      <div className="w-full space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="font-semibold text-3xl tracking-tight">Edit user</h1>
            <p className="text-muted-foreground text-sm">
              Update scanning, speech, and emergency contact preferences.
            </p>
            {displayName ? (
              <Badge variant="outline">{displayName}</Badge>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to={`/users/${userId}`}>Details</Link>
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

        {!loading && prefs ? (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Editing preferences for{' '}
                <span className="font-medium text-foreground">
                  {displayName}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Max scans per hour"
                  type="number"
                  value={String(prefs.maxScansPerHour)}
                  onChange={(v) =>
                    setPrefs({ ...prefs, maxScansPerHour: Number(v || 0) })
                  }
                />
                <Field
                  label="Detection interval (sec)"
                  type="number"
                  value={String(prefs.detectionIntervalSec)}
                  onChange={(v) =>
                    setPrefs({
                      ...prefs,
                      detectionIntervalSec: Number(v || 0),
                    })
                  }
                />
                <Field
                  label="Speech rate"
                  type="number"
                  value={String(prefs.speechRate)}
                  onChange={(v) =>
                    setPrefs({ ...prefs, speechRate: Number(v || 1) })
                  }
                />
                <Field
                  label="Speech language"
                  value={prefs.speechLanguage}
                  onChange={(v) => setPrefs({ ...prefs, speechLanguage: v })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr,auto] md:items-end">
                <Field
                  label="Verbosity"
                  value={prefs.verbosity}
                  onChange={(v) =>
                    setPrefs({
                      ...prefs,
                      verbosity:
                        (v as EditablePreferences['verbosity']) || 'medium',
                    })
                  }
                />
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">Haptics</span>
                  <label
                    htmlFor="haptic-enabled"
                    className="inline-flex h-10 items-center gap-2 rounded-md px-1 text-sm"
                  >
                    <input
                      id="haptic-enabled"
                      type="checkbox"
                      checked={prefs.hapticEnabled}
                      onChange={(e) =>
                        setPrefs({ ...prefs, hapticEnabled: e.target.checked })
                      }
                    />
                    Haptic enabled
                  </label>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Emergency contact name"
                  value={prefs.emergencyContact.name}
                  onChange={(v) =>
                    setPrefs({
                      ...prefs,
                      emergencyContact: {
                        ...prefs.emergencyContact,
                        name: v,
                      },
                    })
                  }
                />
                <Field
                  label="Emergency contact phone"
                  value={prefs.emergencyContact.phone}
                  onChange={(v) =>
                    setPrefs({
                      ...prefs,
                      emergencyContact: {
                        ...prefs.emergencyContact,
                        phone: v,
                      },
                    })
                  }
                />
              </div>

              {success ? (
                <div className="text-green-600 text-sm">{success}</div>
              ) : null}

              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => void load()}
                  disabled={saving}
                >
                  Reload
                </Button>
                <Button onClick={() => void save()} disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PageContent>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const inputId = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="text-muted-foreground text-xs">
        {props.label}
      </label>
      <Input
        id={inputId}
        value={props.value}
        type={props.type ?? 'text'}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </div>
  );
}
