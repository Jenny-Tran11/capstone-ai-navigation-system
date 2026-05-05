import {
  checkAdminModelHealth,
  getAdminMobileConfig,
  runAdminModelTest,
} from '@baseline/client-api/app-config';
import { getRequestHandler } from '@baseline/client-api/request-handler';
import { Badge } from '@baseline/ui/primitives/badge';
import { Button } from '@baseline/ui/primitives/button';
import { useCallback, useEffect, useState } from 'react';
import PageContent from '../../../components/page-content/PageContent';

type HealthResponse = { status: string; model_loaded: boolean };
type DetectResponse = { detections?: unknown[]; scene_description?: string };
type CrossingResponse = { signal?: string; confidence?: number };
type ModelKind = 'detect' | 'crossing';
type InputMode = 'base64' | 'url';

async function fileToBase64(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const [, base64] = result.split(',');
      if (!base64) {
        reject(new Error('Failed to read image as base64.'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

const ModelStatus = (): JSX.Element => {
  const [modelUrl, setModelUrl] = useState<string>('');
  const [crossingUrl, setCrossingUrl] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<ModelKind>('detect');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('base64');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<
    DetectResponse | CrossingResponse | null
  >(null);
  const [testError, setTestError] = useState<string | null>(null);

  const loadRuntimeConfig = useCallback(async () => {
    try {
      const config = await getAdminMobileConfig(getRequestHandler());
      setModelUrl(config.detectApiBaseUrl ?? '');
      setCrossingUrl(config.crossingApiBaseUrl ?? '');
    } catch {
      setError('Could not load runtime config from API.');
    }
  }, []);

  const checkHealth = useCallback(async () => {
    if (!modelUrl) {
      setError('Detect API URL is not configured in Runtime Config.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = (await checkAdminModelHealth(
        getRequestHandler(),
      )) as HealthResponse;
      setHealth(data);
    } catch {
      setError('Could not reach the model service. Is it running?');
    } finally {
      setLoading(false);
    }
  }, [modelUrl]);

  const runTest = useCallback(async () => {
    const activeUrl = selectedModel === 'detect' ? modelUrl : crossingUrl;

    if (!activeUrl) {
      setTestError(
        selectedModel === 'detect'
          ? 'Detect API URL is not configured in Runtime Config.'
          : 'Crossing API URL is not configured in Runtime Config.',
      );
      return;
    }
    if (inputMode === 'base64' && !selectedImage) {
      setTestError('Please select an image first.');
      return;
    }
    if (inputMode === 'url' && !imageUrl.trim()) {
      setTestError('Please enter an image URL.');
      return;
    }
    setTesting(true);
    setTestError(null);
    setTestResult(null);
    try {
      const imageBase64 =
        inputMode === 'base64' && selectedImage
          ? await fileToBase64(selectedImage)
          : undefined;
      const data = (await runAdminModelTest(getRequestHandler(), {
        model: selectedModel,
        imageBase64,
        imageUrl: inputMode === 'url' ? imageUrl.trim() : undefined,
      })) as DetectResponse | CrossingResponse;
      setTestResult(data);
    } catch (e: unknown) {
      const message =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ??
        (e as Error)?.message ??
        null;
      setTestError(
        message ||
          (selectedModel === 'detect'
            ? 'Could not run detect model test with the selected image.'
            : 'Could not run crossing model test with the selected image.'),
      );
    } finally {
      setTesting(false);
    }
  }, [
    crossingUrl,
    imageUrl,
    inputMode,
    modelUrl,
    selectedImage,
    selectedModel,
  ]);

  useEffect(() => {
    void loadRuntimeConfig();
  }, [loadRuntimeConfig]);

  useEffect(() => {
    if (!modelUrl) return;
    void checkHealth();
  }, [checkHealth, modelUrl]);

  return (
    <PageContent
      breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Model' }]}
    >
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="font-semibold text-3xl tracking-tight">
            Model service
          </h1>
          <p className="mt-1 text-muted-foreground">
            YOLOv12n obstacle detection — VPS status and quick image test.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="font-medium">Service health</span>
            {loading ? (
              <Badge variant="secondary">Checking…</Badge>
            ) : health ? (
              <Badge
                variant={health.status === 'ok' ? 'default' : 'destructive'}
              >
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
              {modelUrl || 'Not configured'}
            </span>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            variant="outline"
            onClick={() => void checkHealth()}
            disabled={loading || !modelUrl}
          >
            {loading ? 'Checking…' : 'Refresh status'}
          </Button>
        </div>

        <div className="rounded-xl border bg-card p-6 flex flex-col gap-4">
          <div>
            <h2 className="font-medium text-lg">Test with image</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upload/select a dataset image to validate detect or crossing
              model.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant={selectedModel === 'detect' ? 'default' : 'outline'}
              onClick={() => setSelectedModel('detect')}
              disabled={testing}
            >
              Detect model
            </Button>
            <Button
              variant={selectedModel === 'crossing' ? 'default' : 'outline'}
              onClick={() => setSelectedModel('crossing')}
              disabled={testing}
            >
              Crossing model
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant={inputMode === 'base64' ? 'default' : 'outline'}
              onClick={() => setInputMode('base64')}
              disabled={testing}
            >
              Upload image
            </Button>
            <Button
              variant={inputMode === 'url' ? 'default' : 'outline'}
              onClick={() => setInputMode('url')}
              disabled={testing}
            >
              Image URL
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Active endpoint:{' '}
            {selectedModel === 'detect'
              ? modelUrl || 'Not configured'
              : crossingUrl || 'Not configured'}
          </p>

          {inputMode === 'base64' ? (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedImage(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
          ) : (
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          )}

          {inputMode === 'base64' && selectedImage ? (
            <p className="text-xs text-muted-foreground">
              Selected: {selectedImage.name}
            </p>
          ) : null}
          {inputMode === 'url' ? (
            <p className="text-xs text-muted-foreground">
              Use URL mode for workflows that reject base64 image inputs.
            </p>
          ) : null}

          {testError ? (
            <p className="text-sm text-destructive">{testError}</p>
          ) : null}

          <div className="flex gap-2">
            <Button
              onClick={() => void runTest()}
              disabled={
                testing ||
                !(selectedModel === 'detect' ? modelUrl : crossingUrl) ||
                (inputMode === 'base64' ? !selectedImage : !imageUrl.trim())
              }
            >
              {testing
                ? 'Testing…'
                : selectedModel === 'detect'
                  ? 'Run detect test'
                  : 'Run crossing test'}
            </Button>
          </div>

          {testResult ? (
            <pre className="text-xs bg-muted rounded-md p-3 overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          ) : null}
        </div>
      </div>
    </PageContent>
  );
};

export default ModelStatus;
