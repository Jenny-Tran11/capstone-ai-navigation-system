import type {
  AppConfig,
  MobileRuntimeConfig,
} from '@baseline/types/app-config';
import { appConfigService, MOBILE_CONFIG_ID } from './app-config.service';

export function getMobileRuntimeConfigFromEnv(): MobileRuntimeConfig {
  return {
    detectApiBaseUrl:
      process.env.MOBILE_DETECT_API_URL ??
      process.env.MODEL_API_URL ??
      process.env.DETECT_API_URL ??
      '',
    detectApiKey:
      process.env.MOBILE_DETECT_API_KEY ?? process.env.DETECT_API_KEY ?? '',
    crossingApiBaseUrl:
      process.env.MOBILE_CROSSING_API_URL ?? process.env.CROSSING_API_URL ?? '',
    crossingApiKey:
      process.env.MOBILE_CROSSING_API_KEY ??
      process.env.CROSSING_API_KEY ??
      process.env.DETECT_API_KEY ??
      '',
    googleMapsApiKey:
      process.env.MOBILE_GOOGLE_MAPS_API_KEY ??
      process.env.GOOGLE_MAPS_API_KEY ??
      '',
    googleAiApiKey:
      process.env.MOBILE_GOOGLE_AI_API_KEY ??
      process.env.GOOGLE_AI_API_KEY ??
      '',
    googleAiModel:
      process.env.MOBILE_GOOGLE_AI_MODEL ??
      process.env.GOOGLE_AI_MODEL ??
      'gemini-2.0-flash',
  };
}

export async function getMobileRuntimeConfig(): Promise<MobileRuntimeConfig> {
  const fallback = getMobileRuntimeConfigFromEnv();
  try {
    const stored = await appConfigService.get(MOBILE_CONFIG_ID);
    if (!stored?.configId) return fallback;
    return {
      detectApiBaseUrl:
        stored.mobile?.detectApiBaseUrl ?? fallback.detectApiBaseUrl,
      detectApiKey: stored.mobile?.detectApiKey ?? fallback.detectApiKey,
      crossingApiBaseUrl:
        stored.mobile?.crossingApiBaseUrl ?? fallback.crossingApiBaseUrl,
      crossingApiKey: stored.mobile?.crossingApiKey ?? fallback.crossingApiKey,
      googleMapsApiKey:
        stored.mobile?.googleMapsApiKey ?? fallback.googleMapsApiKey,
      googleAiApiKey: stored.mobile?.googleAiApiKey ?? fallback.googleAiApiKey,
      googleAiModel: stored.mobile?.googleAiModel ?? fallback.googleAiModel,
    };
  } catch {
    return fallback;
  }
}

export function normalizeMobilePatch(
  input: Partial<MobileRuntimeConfig>,
): Partial<MobileRuntimeConfig> {
  const out: Partial<MobileRuntimeConfig> = {};
  if (typeof input.detectApiBaseUrl === 'string')
    out.detectApiBaseUrl = input.detectApiBaseUrl.trim();
  if (typeof input.detectApiKey === 'string')
    out.detectApiKey = input.detectApiKey.trim();
  if (typeof input.crossingApiBaseUrl === 'string')
    out.crossingApiBaseUrl = input.crossingApiBaseUrl.trim();
  if (typeof input.crossingApiKey === 'string')
    out.crossingApiKey = input.crossingApiKey.trim();
  if (typeof input.googleMapsApiKey === 'string')
    out.googleMapsApiKey = input.googleMapsApiKey.trim();
  if (typeof input.googleAiApiKey === 'string')
    out.googleAiApiKey = input.googleAiApiKey.trim();
  if (typeof input.googleAiModel === 'string')
    out.googleAiModel = input.googleAiModel.trim();
  return out;
}

export async function saveMobileRuntimeConfig(
  next: MobileRuntimeConfig,
): Promise<MobileRuntimeConfig> {
  const toSave: Partial<AppConfig> = {
    configId: MOBILE_CONFIG_ID,
    mobile: next,
  };
  try {
    await appConfigService.update(toSave);
  } catch {
    await appConfigService.create(toSave);
  }
  return next;
}
