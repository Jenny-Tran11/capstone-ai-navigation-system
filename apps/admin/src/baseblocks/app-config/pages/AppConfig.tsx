import {
  getAdminMobileConfig,
  updateAdminMobileConfig,
} from '@baseline/client-api/app-config';
import type { MobileRuntimeConfig } from '@baseline/types/app-config';
import { Button } from '@baseline/ui/primitives/button';
import { useCallback, useEffect, useState } from 'react';
import { getRequestHandler } from '@baseline/client-api/request-handler';
import PageContent from '../../../components/page-content/PageContent';

type FormState = MobileRuntimeConfig;

const EMPTY: FormState = {
  detectApiBaseUrl: '',
  detectApiKey: '',
  crossingApiBaseUrl: '',
  crossingApiKey: '',
  googleMapsApiKey: '',
  googleAiApiKey: '',
  googleAiModel: 'gemini-2.0-flash',
};

export default function AppConfigPage(): JSX.Element {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminMobileConfig(getRequestHandler());
      setForm(data);
    } catch {
      setError('Failed to load runtime config.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const data = await updateAdminMobileConfig(getRequestHandler(), form);
      setForm(data);
      setSavedAt(new Date().toLocaleTimeString());
    } catch {
      setError('Failed to save runtime config.');
    } finally {
      setSaving(false);
    }
  }, [form]);

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <PageContent
      breadcrumbs={[
        { label: 'Home', href: '/dashboard' },
        { label: 'Runtime config' },
      ]}
    >
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Runtime config</h1>
          <p className="mt-1 text-muted-foreground">
            Configure mobile model and Google API endpoints from Admin.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <Field
            label="Detect API base URL"
            value={form.detectApiBaseUrl}
            onChange={(v) => setField('detectApiBaseUrl', v)}
            placeholder="http://localhost:8080"
          />
          <Field
            label="Detect API key"
            value={form.detectApiKey}
            onChange={(v) => setField('detectApiKey', v)}
            placeholder="optional"
          />
          <Field
            label="Crossing API base URL"
            value={form.crossingApiBaseUrl}
            onChange={(v) => setField('crossingApiBaseUrl', v)}
            placeholder="optional"
          />
          <Field
            label="Crossing API key"
            value={form.crossingApiKey}
            onChange={(v) => setField('crossingApiKey', v)}
            placeholder="optional"
          />
          <Field
            label="Google Maps API key"
            value={form.googleMapsApiKey}
            onChange={(v) => setField('googleMapsApiKey', v)}
            placeholder="optional"
          />
          <Field
            label="Google AI API key"
            value={form.googleAiApiKey}
            onChange={(v) => setField('googleAiApiKey', v)}
            placeholder="optional"
          />
          <Field
            label="Google AI model"
            value={form.googleAiModel}
            onChange={(v) => setField('googleAiModel', v)}
            placeholder="gemini-2.0-flash"
          />

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {savedAt ? (
            <p className="text-sm text-muted-foreground">Saved at {savedAt}</p>
          ) : null}

          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={loading || saving}
              onClick={() => void load()}
            >
              {loading ? 'Loading…' : 'Reload'}
            </Button>
            <Button disabled={loading || saving} onClick={() => void save()}>
              {saving ? 'Saving…' : 'Save config'}
            </Button>
          </div>
        </div>
      </div>
    </PageContent>
  );
}

function Field(props: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{props.label}</span>
      <input
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
      />
    </label>
  );
}

