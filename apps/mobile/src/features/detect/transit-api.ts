import { apiClient } from '@/lib/api-client';

export type TransitDetectResponse = {
  busNumber: string | null;
  destination: string | null;
};

export async function postTransitDetect(imageBase64: string): Promise<TransitDetectResponse> {
  const { data } = await apiClient.post<TransitDetectResponse>('/transit/user/detect', {
    image_base64: imageBase64,
  });
  return data;
}
