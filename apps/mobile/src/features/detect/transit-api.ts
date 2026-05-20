import { apiClient } from '@/lib/api-client';

export type TransitDetectResponse = {
  busNumber: string | null;
  destination: string | null;
};

export async function postTransitDetect(
  imageBase64: string,
): Promise<TransitDetectResponse> {
  const attempts = [0, 400];
  let lastErr: unknown;
  for (const delayMs of attempts) {
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    try {
      const { data } = await apiClient.post<TransitDetectResponse>(
        '/transit/user/detect',
        { image_base64: imageBase64 },
        { timeout: 12_000 },
      );
      return data;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error('Transit detection request failed');
}
