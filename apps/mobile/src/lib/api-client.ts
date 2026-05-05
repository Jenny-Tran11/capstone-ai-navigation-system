import '@/lib/amplify';
import { fetchAuthSession } from '@aws-amplify/auth';
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/',
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
