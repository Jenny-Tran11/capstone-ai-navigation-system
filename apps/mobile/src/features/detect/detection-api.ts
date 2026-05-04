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

export async function postDetect(imageBase64: string): Promise<DetectResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['X-API-Key'] = API_KEY;

  const { data } = await axios.post<DetectResponse>(
    `${BASE_URL}/detect`,
    { image_base64: imageBase64 },
    { headers, timeout: 15_000 },
  );
  return data;
}
