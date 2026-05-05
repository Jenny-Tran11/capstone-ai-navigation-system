import axios from 'axios';
import { getRuntimeConfig } from '@/lib/runtime-config';

export type SignalState = 'walk' | 'dont_walk' | 'none';

export type CrossingResponse = {
  signal: SignalState;
  confidence: number;
};

// Class names that indicate a walk signal
const WALK_CLASSES = new Set([
  'walk', 'walk_signal', 'walking', 'green_pedestrian',
  'pedestrian_signal_walk', 'go', 'walk-signal',
]);

// Class names that indicate a don't walk / stop signal
const DONT_WALK_CLASSES = new Set([
  'dont_walk', 'dont-walk', 'stop', 'stop_hand', 'red_pedestrian',
  'pedestrian_signal_stop', 'no_walk', 'no-walk', 'red_light',
  'dont_walk_signal',
]);

type RoboflowPrediction = {
  class?: string;
  confidence?: number;
};

function classifySignal(predictions: RoboflowPrediction[]): CrossingResponse {
  if (!predictions.length) return { signal: 'none', confidence: 0 };

  // Sort by confidence descending
  const sorted = [...predictions].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));

  for (const p of sorted) {
    const cls = (p.class ?? '').toLowerCase().replace(/\s+/g, '_');
    const conf = p.confidence ?? 0;
    if (WALK_CLASSES.has(cls)) return { signal: 'walk', confidence: conf };
    if (DONT_WALK_CLASSES.has(cls)) return { signal: 'dont_walk', confidence: conf };
  }

  return { signal: 'none', confidence: 0 };
}

export async function postCrossingDetect(imageBase64: string): Promise<CrossingResponse> {
  const runtime = await getRuntimeConfig();
  const BASE_URL = runtime.crossingApiBaseUrl;
  const API_KEY = runtime.crossingApiKey;
  if (!BASE_URL) return { signal: 'none', confidence: 0 };

  const isWorkflow =
    BASE_URL.includes('serverless.roboflow.com') && BASE_URL.includes('/workflows/');

  if (isWorkflow) {
    const { data } = await axios.post<unknown>(
      BASE_URL,
      { api_key: API_KEY, inputs: { image: { type: 'base64', value: imageBase64 } } },
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
  const { data } = await axios.post<{ predictions?: RoboflowPrediction[] }>(
    BASE_URL,
    { api_key: API_KEY, inputs: { image: { type: 'base64', value: imageBase64 } } },
    { headers: { 'Content-Type': 'application/json' }, timeout: 10_000 },
  );
  return classifySignal(data.predictions ?? []);
}
