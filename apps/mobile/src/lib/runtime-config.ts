import { apiClient } from '@/lib/api-client';

export type MobileRuntimeConfig = {
  detectApiBaseUrl: string;
  detectApiKey: string;
  crossingApiBaseUrl: string;
  crossingApiKey: string;
  googleMapsApiKey: string;
  googleAiApiKey: string;
  googleAiModel: string;
};

const ENV_FALLBACK: MobileRuntimeConfig = {
  detectApiBaseUrl: process.env.EXPO_PUBLIC_DETECT_API_URL ?? '',
  detectApiKey: process.env.EXPO_PUBLIC_DETECT_API_KEY ?? '',
  crossingApiBaseUrl: process.env.EXPO_PUBLIC_CROSSING_API_URL ?? '',
  crossingApiKey:
    process.env.EXPO_PUBLIC_CROSSING_API_KEY ??
    process.env.EXPO_PUBLIC_DETECT_API_KEY ??
    '',
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  googleAiApiKey: process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY ?? '',
  googleAiModel: process.env.EXPO_PUBLIC_GOOGLE_AI_MODEL ?? 'gemini-2.0-flash',
};

let configPromise: Promise<MobileRuntimeConfig> | null = null;

async function fetchRuntimeConfig(): Promise<MobileRuntimeConfig> {
  try {
    const { data } = await apiClient.get<Partial<MobileRuntimeConfig>>(
      '/app-config/user/mobile',
    );
    return {
      detectApiBaseUrl: data.detectApiBaseUrl ?? ENV_FALLBACK.detectApiBaseUrl,
      detectApiKey: data.detectApiKey ?? ENV_FALLBACK.detectApiKey,
      crossingApiBaseUrl:
        data.crossingApiBaseUrl ?? ENV_FALLBACK.crossingApiBaseUrl,
      crossingApiKey: data.crossingApiKey ?? ENV_FALLBACK.crossingApiKey,
      googleMapsApiKey: data.googleMapsApiKey ?? ENV_FALLBACK.googleMapsApiKey,
      googleAiApiKey: data.googleAiApiKey ?? ENV_FALLBACK.googleAiApiKey,
      googleAiModel: data.googleAiModel ?? ENV_FALLBACK.googleAiModel,
    };
  } catch {
    return ENV_FALLBACK;
  }
}

export async function getRuntimeConfig(): Promise<MobileRuntimeConfig> {
  if (!configPromise) configPromise = fetchRuntimeConfig();
  return configPromise;
}

export function clearRuntimeConfigCache(): void {
  configPromise = null;
}
