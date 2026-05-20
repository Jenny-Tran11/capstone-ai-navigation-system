import axios from 'axios';
import { getRuntimeConfig } from '@/lib/runtime-config';

export type SignalState = 'walk' | 'dont_walk' | 'none';

export type CrossingResponse = {
  signal: SignalState;
  confidence: number;
};

// Class names that indicate a walk signal
const WALK_CLASSES = new Set([
  'walk',
  'walk_signal',
  'walking',
  'green_pedestrian',
  'pedestrian_signal_walk',
  'go',
  'walk-signal',
]);

// Class names that indicate a don't walk / stop signal
const DONT_WALK_CLASSES = new Set([
  'dont_walk',
  'dont-walk',
  'stop',
  'stop_hand',
  'red_pedestrian',
  'pedestrian_signal_stop',
  'no_walk',
  'no-walk',
  'red_light',
  'dont_walk_signal',
]);

type RoboflowPrediction = {
  class?: string;
  confidence?: number;
};

const HARDCODED_CROSSING_BASE_URL = 'https://inference.trananhlanhuu.me';
const HARDCODED_CROSSING_API_KEY = '';

function getRoboflowModelIdFromEndpoint(url: string): string | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const version = parts[parts.length - 1];
    const model = parts[parts.length - 2];
    if (!/^\d+$/.test(version) || !model) return null;
    return `${model}/${version}`;
  } catch {
    return null;
  }
}

function classifySignal(predictions: RoboflowPrediction[]): CrossingResponse {
  if (!predictions.length) return { signal: 'none', confidence: 0 };

  // Sort by confidence descending
  const sorted = [...predictions].sort(
    (a, b) => (b.confidence ?? 0) - (a.confidence ?? 0),
  );

  for (const p of sorted) {
    const cls = (p.class ?? '').toLowerCase().replace(/\s+/g, '_');
    const conf = p.confidence ?? 0;
    if (WALK_CLASSES.has(cls)) return { signal: 'walk', confidence: conf };
    if (DONT_WALK_CLASSES.has(cls))
      return { signal: 'dont_walk', confidence: conf };
  }

  return { signal: 'none', confidence: 0 };
}

export async function postCrossingDetect(
  imageBase64: string,
): Promise<CrossingResponse> {
  const runtime = await getRuntimeConfig();
  const BASE_URL = HARDCODED_CROSSING_BASE_URL || runtime.crossingApiBaseUrl;
  const API_KEY = HARDCODED_CROSSING_API_KEY || runtime.crossingApiKey;
  if (!BASE_URL) return { signal: 'none', confidence: 0 };
  const roboflowModelId = getRoboflowModelIdFromEndpoint(BASE_URL);
  const cleanBase64 = imageBase64.replace(
    /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
    '',
  );
  const postJson = async (url: string, body: unknown, timeoutMs = 10_000) => {
    const attempts = [0, 300];
    let lastErr: unknown;
    for (const delayMs of attempts) {
      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
      try {
        const { data } = await axios.post<{ predictions?: RoboflowPrediction[] }>(
          url,
          body,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
            },
            timeout: timeoutMs,
          },
        );
        return data;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('request failed');
  };

  const isWorkflow =
    BASE_URL.includes('serverless.roboflow.com') &&
    BASE_URL.includes('/workflows/');

  if (roboflowModelId) {
    const origin = new URL(BASE_URL).origin;
    const { data } = await axios.post<{ predictions?: RoboflowPrediction[] }>(
      `${origin}/infer/object_detection`,
      {
        id: `mobile-crossing-${Date.now()}`,
        api_key: API_KEY,
        model_id: roboflowModelId,
        image: { type: 'base64', value: cleanBase64 },
      },
    );
    return classifySignal(data.predictions ?? []);
  }

  if (isWorkflow) {
    const { data } = await axios.post<unknown>(
      BASE_URL,
      {
        api_key: API_KEY,
        inputs: { image: { type: 'base64', value: cleanBase64 } },
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10_000 },
    );
    const payload = data as {
      outputs?: { predictions?: RoboflowPrediction[] };
      predictions?: RoboflowPrediction[];
    };
    const preds = payload.outputs?.predictions ?? payload.predictions ?? [];
    return classifySignal(preds);
  }

  // Generic endpoint (returns predictions array directly)
  const origin = new URL(BASE_URL).origin;
  try {
    const data = await postJson(`${origin}/detect`, {
      image: { type: 'base64', value: cleanBase64 },
      conf: 0.2,
    });
    return classifySignal(data.predictions ?? []);
  } catch {
    const data = await postJson(BASE_URL, {
      api_key: API_KEY,
      inputs: { image: { type: 'base64', value: cleanBase64 } },
    });
    return classifySignal(data.predictions ?? []);
  }
}
