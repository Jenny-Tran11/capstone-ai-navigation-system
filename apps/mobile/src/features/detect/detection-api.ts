import { getRuntimeConfig } from '@/lib/runtime-config';

export type DetectionResult = {
  name: string;
  confidence: number;
  box: [number, number, number, number];
  obstacleType: 'dynamic' | 'static' | 'surface' | 'unknown';
  proximity: 'far' | 'near' | 'very_near';
};

export type DetectResponse = {
  detections: DetectionResult[];
  scene_description: string;
};

type RoboflowPrediction = {
  class?: string;
  confidence?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
};

const HARDCODED_DETECT_BASE_URL = '';
const HARDCODED_DETECT_API_KEY = '';

function isRoboflowWorkflowEndpoint(url: string): boolean {
  return url.includes('serverless.roboflow.com') && url.includes('/workflows/');
}

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

function toBox(
  prediction: RoboflowPrediction,
): [number, number, number, number] | null {
  // YOLO-style corner format
  if (
    typeof prediction.x1 === 'number' &&
    typeof prediction.y1 === 'number' &&
    typeof prediction.x2 === 'number' &&
    typeof prediction.y2 === 'number'
  ) {
    return [prediction.x1, prediction.y1, prediction.x2, prediction.y2];
  }

  // Roboflow center/size format
  const x = prediction.x;
  const y = prediction.y;
  const width = prediction.width;
  const height = prediction.height;
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number'
  ) {
    return null;
  }

  const x1 = x - width / 2;
  const y1 = y - height / 2;
  const x2 = x + width / 2;
  const y2 = y + height / 2;
  return [x1, y1, x2, y2];
}

const CLASS_LABEL: Record<string, string> = {
  'hazard-sign': 'hazard sign',
  crosswalk: 'crosswalk',
  stairs: 'stairs',
  person: 'person',
  animal: 'animal',
  bike: 'bicycle',
  vehicle: 'vehicle',
};

const DYNAMIC_CLASSES = new Set([
  'person',
  'bicycle',
  'bike',
  'motorcycle',
  'car',
  'bus',
  'truck',
  'train',
  'dog',
  'cat',
  'animal',
]);

const SURFACE_CLASSES = new Set([
  'stairs',
  'step',
  'crosswalk',
  'pothole',
  'curb',
]);

const STATIC_CLASSES = new Set([
  'chair',
  'bench',
  'table',
  'dining table',
  'traffic light',
  'fire hydrant',
  'pole',
  'wall',
  'door',
  'hazard-sign',
]);

function classifyObstacleType(name: string): DetectionResult['obstacleType'] {
  const n = name.toLowerCase();
  if (DYNAMIC_CLASSES.has(n)) return 'dynamic';
  if (SURFACE_CLASSES.has(n)) return 'surface';
  if (STATIC_CLASSES.has(n)) return 'static';
  return 'unknown';
}

function inferProximity(
  box: [number, number, number, number],
  imageArea: number,
): DetectionResult['proximity'] {
  const [x1, y1, x2, y2] = box;
  const area = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const ratio = imageArea > 0 ? area / imageArea : 0;
  if (ratio >= 0.2) return 'very_near';
  if (ratio >= 0.1) return 'near';
  return 'far';
}

function sceneDescriptionFromDetections(detections: DetectionResult[]): string {
  if (!detections.length) return 'Path is clear.';

  const closeBy = detections.filter((d) => d.proximity !== 'far');
  const typeCounts: Record<DetectionResult['obstacleType'], number> = {
    dynamic: 0,
    static: 0,
    surface: 0,
    unknown: 0,
  };
  for (const d of detections) typeCounts[d.obstacleType] += 1;

  const parts: string[] = [];
  if (closeBy.length) {
    const veryNearCount = closeBy.filter((d) => d.proximity === 'very_near').length;
    if (veryNearCount > 0) {
      parts.push(
        veryNearCount === 1
          ? 'Warning. Object very close.'
          : `Warning. ${veryNearCount} objects very close.`,
      );
    } else {
      parts.push(
        closeBy.length === 1
          ? 'Caution. Object nearby.'
          : `Caution. ${closeBy.length} nearby objects.`,
      );
    }
  }

  const summaryBits: string[] = [];
  if (typeCounts.dynamic) summaryBits.push(`${typeCounts.dynamic} dynamic`);
  if (typeCounts.static) summaryBits.push(`${typeCounts.static} static`);
  if (typeCounts.surface) summaryBits.push(`${typeCounts.surface} surface`);
  if (typeCounts.unknown) summaryBits.push(`${typeCounts.unknown} unknown`);
  if (summaryBits.length) parts.push(`Obstacles: ${summaryBits.join(', ')}.`);

  const top = [...detections]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 4)
    .map((d) => {
      const n = d.name.toLowerCase();
      const label = CLASS_LABEL[n] ?? d.name;
      return d.proximity === 'very_near' ? `${label} very close` : label;
    });
  if (top.length) parts.push(`Detected: ${top.join(', ')}.`);

  return parts.join('. ');
}

function parseRoboflowDetectResponse(data: unknown): DetectResponse {
  const payload = data as {
    outputs?:
      | Array<{
          predictions?:
            | RoboflowPrediction[]
            | { predictions?: RoboflowPrediction[] };
        }>
      | { predictions?: RoboflowPrediction[] };
    predictions?: RoboflowPrediction[];
  };

  // Workflow responses return outputs as an array; direct model responses return an object
  const outputItem = Array.isArray(payload.outputs)
    ? payload.outputs[0]
    : payload.outputs;

  // predictions may be a raw array or a nested object with a predictions key
  const rawPreds = outputItem?.predictions ?? payload.predictions ?? [];
  const predictions: RoboflowPrediction[] = Array.isArray(rawPreds)
    ? rawPreds
    : ((rawPreds as { predictions?: RoboflowPrediction[] }).predictions ?? []);
  const imageW = Number((payload as { image?: { width?: number } }).image?.width ?? 0);
  const imageH = Number((payload as { image?: { height?: number } }).image?.height ?? 0);

  let fallbackMaxX = 0;
  let fallbackMaxY = 0;
  for (const p of predictions) {
    const box = toBox(p);
    if (!box) continue;
    fallbackMaxX = Math.max(fallbackMaxX, box[2]);
    fallbackMaxY = Math.max(fallbackMaxY, box[3]);
  }
  const fallbackArea = Math.max(1, fallbackMaxX * fallbackMaxY);
  const imageArea = imageW > 0 && imageH > 0 ? imageW * imageH : fallbackArea;

  const detections: DetectionResult[] = predictions
    .map((prediction) => {
      const name = prediction.class ?? 'object';
      const confidence =
        typeof prediction.confidence === 'number' ? prediction.confidence : 0;
      const box = toBox(prediction);
      if (!box) return null;
      const obstacleType = classifyObstacleType(name);
      const proximity = inferProximity(box, imageArea);
      return { name, confidence, box, obstacleType, proximity };
    })
    .filter((item): item is DetectionResult => item !== null);

  return {
    detections,
    scene_description: sceneDescriptionFromDetections(detections),
  };
}

export async function postDetect(imageBase64: string): Promise<DetectResponse> {
  // Cloud inference (self-hosted / Roboflow workflow / custom API).
  // On-device TFLite lives in local-inference.ts; add apps/mobile/assets/model.tflite
  // and wire it back in here when you want offline detection.
  const runtime = await getRuntimeConfig();
  const BASE_URL = (HARDCODED_DETECT_BASE_URL || runtime.detectApiBaseUrl).replace(/\/+$/, '');
  const API_KEY = HARDCODED_DETECT_API_KEY || runtime.detectApiKey;
  const roboflowModelId = getRoboflowModelIdFromEndpoint(BASE_URL);
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

  const postJson = async (url: string, body: unknown, timeoutMs = 20_000) => {
    const attempts = [0, 350];
    let lastErr: unknown;
    for (const delayMs of attempts) {
      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), timeoutMs);
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (API_KEY) headers['X-API-Key'] = API_KEY;
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: ctl.signal,
        });
        const text = await res.text();
        if (!res.ok) throw new Error(`${res.status} ${text}`);
        return text ? JSON.parse(text) : {};
      } catch (err) {
        lastErr = err;
      } finally {
        clearTimeout(t);
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('request failed');
  };

  // Self-hosted YOLO/Inference server endpoint compatibility:
  // try /detect first, then /infer/object_detection fallback.
  if (roboflowModelId) {
    const origin = new URL(BASE_URL).origin;
    const detectBody = {
      image: { type: 'base64', value: cleanBase64 },
      conf: 0.2,
    };
    const inferBody = {
      id: `mobile-detect-${Date.now()}`,
      api_key: API_KEY,
      model_id: roboflowModelId,
      image: { type: 'base64', value: cleanBase64 },
      conf: 0.2,
    };

    try {
      const data = await postJson(`${origin}/detect`, detectBody);
      return parseRoboflowDetectResponse(data);
    } catch (e1) {
      try {
        const data = await postJson(
          `${origin}/infer/object_detection`,
          inferBody,
        );
        return parseRoboflowDetectResponse(data);
      } catch (e2) {
        throw new Error(
          `Detect failed (/detect and /infer): ${String(e2 instanceof Error ? e2.message : e2)}; first=${String(e1 instanceof Error ? e1.message : e1)}`,
        );
      }
    }
  }

  // Roboflow serverless workflow
  if (isRoboflowWorkflowEndpoint(BASE_URL)) {
    const data = await postJson(BASE_URL, {
      api_key: API_KEY,
      inputs: { image: { type: 'base64', value: cleanBase64 } },
    }, 20_000);
    return parseRoboflowDetectResponse(data);
  }

  // Custom inference API (fetch is more reliable than axios in RN for large payloads)
  const data = await postJson(
    `${BASE_URL}/detect`,
    {
      image: { type: 'base64', value: cleanBase64 },
      image_base64: cleanBase64,
      conf: 0.2,
    },
    20_000,
  );
  return parseRoboflowDetectResponse(data);
}
