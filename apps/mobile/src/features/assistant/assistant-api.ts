import { apiClient } from '@/lib/api-client';

export type AssistantInteractRequest = {
  audioBase64: string;
  mimeType?: string;
  mode?: string;
  lastDetections?: string[];
  activeRouteStep?: string;
};

export type AssistantInteractResponse = {
  transcript: string;
  replyText: string;
  intent?: string | null;
  latencyMs?: number;
};

export async function postAssistantInteract(
  payload: AssistantInteractRequest,
): Promise<AssistantInteractResponse> {
  const { data } = await apiClient.post<AssistantInteractResponse>(
    '/assistant/user/interact',
    payload,
    { timeout: 30_000 },
  );
  return data;
}

