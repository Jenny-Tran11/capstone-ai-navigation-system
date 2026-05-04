import { Badge } from '@baseline/ui/primitives/badge';
import { Button } from '@baseline/ui/primitives/button';
import { useCallback, useEffect, useState } from 'react';
import PageContent from '../../../components/page-content/PageContent';

type HealthResponse = { status: string; model_loaded: boolean };

const MODEL_URL = import.meta.env.VITE_MODEL_API_URL as string | undefined;

const ModelStatus = (): JSX.Element => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    if (!MODEL_URL) {
      setError('VITE_MODEL_API_URL is not configured.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${MODEL_URL}/health`);
      const data = (await res.json()) as HealthResponse;
      setHealth(data);
    } catch {
      setError('Could not reach the model service. Is it running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  return (
    <PageContent
      breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Model' }]}
    >
      <div className="flex flex-col gap-6 max-w-lg">
        <div>
          <h1 className="font-semibold text-3xl tracking-tight">Model service</h1>
          <p className="mt-1 text-muted-foreground">YOLOv12n obstacle detection — VPS status</p>
        </div>

        <div className="rounded-xl border bg-card p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="font-medium">Service health</span>
            {loading ? (
              <Badge variant="secondary">Checking…</Badge>
            ) : health ? (
              <Badge variant={health.status === 'ok' ? 'default' : 'destructive'}>
                {health.status === 'ok' ? '● Online' : '● Degraded'}
              </Badge>
            ) : (
              <Badge variant="outline">Unknown</Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Model loaded</span>
            {health ? (
              <Badge variant={health.model_loaded ? 'default' : 'destructive'}>
                {health.model_loaded ? 'Yes' : 'No'}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Model</span>
            <span className="text-sm font-mono">YOLOv12n (30 classes)</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Endpoint</span>
            <span className="text-sm font-mono text-muted-foreground truncate max-w-48">
              {MODEL_URL ?? 'Not configured'}
            </span>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button variant="outline" onClick={() => void checkHealth()} disabled={loading}>
            {loading ? 'Checking…' : 'Refresh status'}
          </Button>
        </div>
      </div>
    </PageContent>
  );
};

export default ModelStatus;
