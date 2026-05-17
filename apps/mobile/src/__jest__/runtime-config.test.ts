/**
 * Missing runtime config handling
 *
 * Tests getRuntimeConfig() in three scenarios:
 *   1. API call succeeds — returned values override ENV_FALLBACK
 *   2. API call fails   — ENV_FALLBACK env-vars are used
 *   3. Both API and env-vars are absent — every field is an empty string
 *      except googleAiModel which has a hardcoded default
 *
 * clearRuntimeConfigCache() is called before each test so the singleton
 * promise doesn't bleed between cases.
 */

jest.mock('@/lib/api-client', () => ({
  apiClient: { get: jest.fn() },
}));

// api-client imports amplify at the top level — stub it out
jest.mock('@/lib/amplify', () => ({}));

import { apiClient } from '@/lib/api-client';
import {
  clearRuntimeConfigCache,
  getRuntimeConfig,
} from '../lib/runtime-config';

beforeEach(() => {
  clearRuntimeConfigCache();
  jest.clearAllMocks();
});

// ── API success path ──────────────────────────────────────────────────────────

describe('getRuntimeConfig — API responds', () => {
  it('returns values from the API response', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: {
        detectApiBaseUrl: 'https://detect.example.com',
        detectApiKey: 'api-key-123',
        crossingApiBaseUrl: 'https://crossing.example.com',
        crossingApiKey: 'crossing-key',
        googleMapsApiKey: 'maps-key',
        googleAiApiKey: 'ai-key',
        googleAiModel: 'gemini-ultra',
      },
    });

    const config = await getRuntimeConfig();

    expect(config.detectApiBaseUrl).toBe('https://detect.example.com');
    expect(config.detectApiKey).toBe('api-key-123');
    expect(config.googleAiModel).toBe('gemini-ultra');
  });

  it('uses empty string for fields absent from a partial API response', async () => {
    // ENV_FALLBACK is captured at module-load time (before any env vars are set
    // in tests), so all fallback values in this test suite are empty strings.
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { googleAiModel: 'gemini-pro' }, // only googleAiModel present
    });

    const config = await getRuntimeConfig();

    expect(config.detectApiBaseUrl).toBe('');
    expect(config.detectApiKey).toBe('');
    expect(config.googleAiModel).toBe('gemini-pro');
  });
});

// ── API failure path ──────────────────────────────────────────────────────────

describe('getRuntimeConfig — API fails', () => {
  it('returns empty strings for all fields when the API throws and no env vars are set', async () => {
    // When the API throws, fetchRuntimeConfig() catches and returns ENV_FALLBACK.
    // Since no env vars are set in this test environment, all fallback values
    // are empty strings (except googleAiModel which has a hard-coded default).
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    const config = await getRuntimeConfig();

    expect(config.detectApiBaseUrl).toBe('');
    expect(config.detectApiKey).toBe('');
    expect(config.googleMapsApiKey).toBe('');
    expect(config.googleAiApiKey).toBe('');
  });

  it('crossingApiKey is empty when neither crossing nor detect API key env vars are set', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    const config = await getRuntimeConfig();

    expect(config.crossingApiKey).toBe('');
  });
});

// ── No API, no env vars ───────────────────────────────────────────────────────

describe('getRuntimeConfig — nothing configured', () => {
  it('returns empty strings for all URL and key fields', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('offline'));

    const config = await getRuntimeConfig();

    expect(config.detectApiBaseUrl).toBe('');
    expect(config.detectApiKey).toBe('');
    expect(config.crossingApiBaseUrl).toBe('');
    expect(config.crossingApiKey).toBe('');
    expect(config.googleMapsApiKey).toBe('');
    expect(config.googleAiApiKey).toBe('');
  });

  it('googleAiModel defaults to gemini-2.0-flash when not configured', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('offline'));

    const config = await getRuntimeConfig();

    expect(config.googleAiModel).toBe('gemini-2.0-flash');
  });
});

// ── Singleton caching ─────────────────────────────────────────────────────────

describe('getRuntimeConfig — singleton caching', () => {
  it('calls the API exactly once across multiple awaits', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: {} });

    await getRuntimeConfig();
    await getRuntimeConfig();
    await getRuntimeConfig();

    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('clearRuntimeConfigCache() causes the next call to re-fetch', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: {} });

    await getRuntimeConfig();
    clearRuntimeConfigCache();
    await getRuntimeConfig();

    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });
});
