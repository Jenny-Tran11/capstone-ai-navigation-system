import type { BaseObject } from './base-object';

export interface MobileRuntimeConfig {
  detectApiBaseUrl: string;
  detectApiKey: string;
  crossingApiBaseUrl: string;
  crossingApiKey: string;
  googleMapsApiKey: string;
  googleAiApiKey: string;
  googleAiModel: string;
}

export interface AppConfig extends BaseObject {
  configId: string;
  mobile: MobileRuntimeConfig;
}

