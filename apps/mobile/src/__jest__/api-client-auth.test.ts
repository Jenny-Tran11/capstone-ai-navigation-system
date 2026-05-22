/**
 * API client — authenticated endpoint request shapes
 *
 * Tests the Axios instance exported from api-client.ts:
 *   - The request interceptor attaches `Authorization: Bearer <token>` when
 *     Amplify provides an idToken.
 *   - The header is omitted (request still proceeds) in all unauthenticated
 *     or error scenarios.
 *   - The correct baseURL reaches the server.
 *   - POST/PUT bodies are serialised as JSON.
 *
 * We install a custom adapter so no real HTTP calls are made and we can
 * inspect the final InternalAxiosRequestConfig that would have been sent.
 */

// Stub the Amplify side-effect import that runs at module load time.
jest.mock('@/lib/amplify', () => ({}));

jest.mock('@aws-amplify/auth', () => ({
  fetchAuthSession: jest.fn(),
}));

import type { InternalAxiosRequestConfig } from 'axios';
import { fetchAuthSession } from '@aws-amplify/auth';
import { apiClient } from '../lib/api-client';

// Capture every outgoing request config before it reaches the network.
let lastConfig: InternalAxiosRequestConfig | null = null;

beforeAll(() => {
  apiClient.defaults.adapter = async (config) => {
    lastConfig = config;
    return {
      status: 200,
      statusText: 'OK',
      data: {},
      headers: {},
      config,
      request: {},
    };
  };
});

beforeEach(() => {
  lastConfig = null;
  jest.clearAllMocks();
});

// ── Authorization header ──────────────────────────────────────────────────────

describe('Authorization header', () => {
  it('attaches Bearer token when the session has an idToken', async () => {
    (fetchAuthSession as jest.Mock).mockResolvedValue({
      tokens: { idToken: { toString: () => 'signed-jwt-abc123' } },
    });

    await apiClient.get('/user-profile/user/me');

    expect(lastConfig?.headers?.['Authorization']).toBe('Bearer signed-jwt-abc123');
  });

  it('omits the header when fetchAuthSession throws', async () => {
    (fetchAuthSession as jest.Mock).mockRejectedValue(new Error('Not signed in'));

    await apiClient.get('/user-profile/user/me');

    expect(lastConfig?.headers?.['Authorization']).toBeUndefined();
  });

  it('omits the header when the session has no tokens', async () => {
    (fetchAuthSession as jest.Mock).mockResolvedValue({ tokens: undefined });

    await apiClient.get('/some-endpoint');

    expect(lastConfig?.headers?.['Authorization']).toBeUndefined();
  });

  it('omits the header when idToken is undefined', async () => {
    (fetchAuthSession as jest.Mock).mockResolvedValue({
      tokens: { idToken: undefined },
    });

    await apiClient.get('/some-endpoint');

    expect(lastConfig?.headers?.['Authorization']).toBeUndefined();
  });

  it('uses the token string returned by idToken.toString()', async () => {
    const token = 'eyJhbGci.eyJzdWIiOiJ1c2VyLTEyMyJ9.sig';
    (fetchAuthSession as jest.Mock).mockResolvedValue({
      tokens: { idToken: { toString: () => token } },
    });

    await apiClient.get('/anything');

    expect(lastConfig?.headers?.['Authorization']).toBe(`Bearer ${token}`);
  });
});

// ── Request shape ─────────────────────────────────────────────────────────────

describe('request shape', () => {
  it('sends Content-Type application/json for POST requests', async () => {
    (fetchAuthSession as jest.Mock).mockResolvedValue({ tokens: undefined });

    await apiClient.post('/detection/user', { sceneDescription: 'clear path' });

    expect(String(lastConfig?.headers?.['Content-Type'] ?? '')).toMatch(
      /application\/json/,
    );
  });

  it('serialises the request body as JSON', async () => {
    (fetchAuthSession as jest.Mock).mockResolvedValue({ tokens: undefined });
    const body = { speechRate: 1.5, hapticEnabled: false };

    await apiClient.put('/user-profile/user/preferences', body);

    expect(lastConfig?.data).toEqual(JSON.stringify(body));
  });

  it('uses the configured base URL', () => {
    const expected = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/';
    expect(apiClient.defaults.baseURL).toBe(expected);
  });
});
