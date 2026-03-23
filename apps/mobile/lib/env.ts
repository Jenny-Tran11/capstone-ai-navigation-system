/**
 * Public env vars (Expo inlines EXPO_PUBLIC_* at bundle time).
 * Copy .env.example to .env and fill values — never commit .env.
 */
export const env = {
  detectApiUrl: process.env.EXPO_PUBLIC_DETECT_API_URL ?? "",
  detectApiKey: process.env.EXPO_PUBLIC_DETECT_API_KEY ?? "",
};

export function isDetectConfigured(): boolean {
  return Boolean(env.detectApiUrl.trim() && env.detectApiKey.trim());
}
