import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_DETECT_API_URL ?? '';
const API_KEY = process.env.EXPO_PUBLIC_DETECT_API_KEY ?? '';

export type DetectionResult = {
  name: string;
  confidence: number;
  box: [number, number, number, number];
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
};

function isRoboflowWorkflowEndpoint(url: string): boolean {
  return url.includes('serverless.roboflow.com') && url.includes('/workflows/');
}

function toBox(
  prediction: RoboflowPrediction,
): [number, number, number, number] | null {
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

function sceneDescriptionFromDetections(detections: DetectionResult[]): string {
  if (!detections.length) return 'Path is clear.';
  const top = [...detections]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
  return top
    .map((d) => `${d.name} (${Math.round(d.confidence * 100)}%)`)
    .join(', ');
}

function parseRoboflowDetectResponse(data: unknown): DetectResponse {
  const payload = data as {
    outputs?: { predictions?: RoboflowPrediction[]; count_objects?: number };
    predictions?: RoboflowPrediction[];
  };

  const predictions = payload.outputs?.predictions ?? payload.predictions ?? [];
  const detections: DetectionResult[] = predictions
    .map((prediction) => {
      const name = prediction.class ?? 'object';
      const confidence =
        typeof prediction.confidence === 'number' ? prediction.confidence : 0;
      const box = toBox(prediction);
      if (!box) return null;
      return { name, confidence, box };
    })
    .filter((item): item is DetectionResult => item !== null);

  return {
    detections,
    scene_description: sceneDescriptionFromDetections(detections),
  };
}

export async function postDetect(imageBase64: string): Promise<DetectResponse> {
  if (isRoboflowWorkflowEndpoint(BASE_URL)) {
    const { data } = await axios.post<unknown>(
      BASE_URL,
      {
        api_key: API_KEY,
        inputs: {
          image: { type: 'base64', value: imageBase64 },
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15_000,
      },
    );
    return parseRoboflowDetectResponse(data);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }

  const { data } = await axios.post<DetectResponse>(
    `${BASE_URL}/detect`,
    { image_base64: imageBase64 },
    { headers, timeout: 15_000 },
  );
  return data;
}
