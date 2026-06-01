import '@/lib/amplify';
import { fetchAuthSession } from '@aws-amplify/auth';
import axios from 'axios';

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
