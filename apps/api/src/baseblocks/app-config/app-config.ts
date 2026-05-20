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
    bedrockTransitModelId:
      process.env.MOBILE_BEDROCK_TRANSIT_MODEL_ID ??
      process.env.BEDROCK_MODEL_ID ??
      'apac.amazon.nova-lite-v1:0',
    bedrockAssistantModelId:
      process.env.MOBILE_BEDROCK_ASSISTANT_MODEL_ID ??
      process.env.BEDROCK_ASSISTANT_MODEL_ID ??
      'apac.amazon.nova-lite-v1:0',
    transcribeLanguageCode:
      process.env.MOBILE_TRANSCRIBE_LANGUAGE_CODE ??
      process.env.TRANSCRIBE_LANGUAGE_CODE ??
      'en-AU',
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
      bedrockTransitModelId:
        stored.mobile?.bedrockTransitModelId ?? fallback.bedrockTransitModelId,
      bedrockAssistantModelId:
        stored.mobile?.bedrockAssistantModelId ??
        fallback.bedrockAssistantModelId,
      transcribeLanguageCode:
        stored.mobile?.transcribeLanguageCode ?? fallback.transcribeLanguageCode,
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
  if (typeof input.bedrockTransitModelId === 'string')
    out.bedrockTransitModelId = input.bedrockTransitModelId.trim();
  if (typeof input.bedrockAssistantModelId === 'string')
    out.bedrockAssistantModelId = input.bedrockAssistantModelId.trim();
  if (typeof input.transcribeLanguageCode === 'string')
    out.transcribeLanguageCode = input.transcribeLanguageCode.trim();
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
