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
let cacheExpiresAt = 0;
const CONFIG_CACHE_TTL_MS = 60_000;

async function fetchRuntimeConfig(): Promise<MobileRuntimeConfig> {
  const pick = (value: string | undefined | null, fallback: string): string => {
    if (typeof value !== 'string') return fallback;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  };

  try {
    const { data } = await apiClient.get<Partial<MobileRuntimeConfig>>(
      '/app-config/user/mobile',
    );
    return {
      detectApiBaseUrl: pick(
        data.detectApiBaseUrl,
        ENV_FALLBACK.detectApiBaseUrl,
      ),
      detectApiKey: pick(data.detectApiKey, ENV_FALLBACK.detectApiKey),
      crossingApiBaseUrl: pick(
        data.crossingApiBaseUrl,
        ENV_FALLBACK.crossingApiBaseUrl,
      ),
      crossingApiKey: pick(data.crossingApiKey, ENV_FALLBACK.crossingApiKey),
      googleMapsApiKey: pick(
        data.googleMapsApiKey,
        ENV_FALLBACK.googleMapsApiKey,
      ),
      googleAiApiKey: pick(data.googleAiApiKey, ENV_FALLBACK.googleAiApiKey),
      googleAiModel: pick(data.googleAiModel, ENV_FALLBACK.googleAiModel),
    };
  } catch {
    return ENV_FALLBACK;
  }
}

export async function getRuntimeConfig(): Promise<MobileRuntimeConfig> {
  const now = Date.now();
  if (!configPromise || now >= cacheExpiresAt) {
    configPromise = fetchRuntimeConfig();
    cacheExpiresAt = now + CONFIG_CACHE_TTL_MS;
  }
  return configPromise;
}

export function clearRuntimeConfigCache(): void {
  configPromise = null;
  cacheExpiresAt = 0;
}
