import '@/lib/amplify';
import { fetchAuthSession } from '@aws-amplify/auth';
import axios from 'axios';
import { addApiDebugEntry, safeStringify } from '@/lib/api-debug-store';

/** Default API when `EXPO_PUBLIC_API_URL` is unset (staging API Gateway). */
const DEFAULT_API_BASE_URL =
  'https://het5wr2i9g.execute-api.ap-southeast-2.amazonaws.com/staging/';

function resolveApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (raw) {
    return raw.endsWith('/') ? raw : `${raw}/`;
  }
  return DEFAULT_API_BASE_URL;
}

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  const startedAt = Date.now();
  (config as typeof config & { _debugStartedAt?: number })._debugStartedAt =
    startedAt;
  addApiDebugEntry({
    type: 'request',
    client: 'axios',
    method: (config.method ?? 'GET').toUpperCase(),
    url: `${config.baseURL ?? ''}${config.url ?? ''}`,
    requestBody:
      config.data !== undefined ? safeStringify(config.data) : undefined,
  });
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // unauthenticated — let request proceed without header
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const cfg = response.config as typeof response.config & {
      _debugStartedAt?: number;
    };
    addApiDebugEntry({
      type: 'response',
      client: 'axios',
      method: (cfg.method ?? 'GET').toUpperCase(),
      url: `${cfg.baseURL ?? ''}${cfg.url ?? ''}`,
      status: response.status,
      durationMs: cfg._debugStartedAt
        ? Date.now() - cfg._debugStartedAt
        : undefined,
      responseBody:
        response.data !== undefined ? safeStringify(response.data) : undefined,
    });
    return response;
  },
  (error) => {
    const cfg = (error?.config ?? {}) as {
      method?: string;
      baseURL?: string;
      url?: string;
      _debugStartedAt?: number;
    };
    addApiDebugEntry({
      type: 'error',
      client: 'axios',
      method: (cfg.method ?? 'GET').toUpperCase(),
      url: `${cfg.baseURL ?? ''}${cfg.url ?? ''}`,
      status: error?.response?.status,
      durationMs: cfg._debugStartedAt
        ? Date.now() - cfg._debugStartedAt
        : undefined,
      error: error?.message ?? 'request failed',
      responseBody:
        error?.response?.data !== undefined
          ? safeStringify(error.response.data)
          : undefined,
    });
    return Promise.reject(error);
  },
);
