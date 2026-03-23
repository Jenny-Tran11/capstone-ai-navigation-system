/**
 * Public env vars (Expo inlines EXPO_PUBLIC_* at bundle time).
 * Copy .env.example to .env and fill values — never commit .env.
 */
export const env = {
  detectApiUrl: process.env.EXPO_PUBLIC_DETECT_API_URL ?? "",
  detectApiKey: process.env.EXPO_PUBLIC_DETECT_API_KEY ?? "",
  userApiUrl: process.env.EXPO_PUBLIC_USER_API_URL ?? "",
  cognitoUserPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID ?? "",
  cognitoClientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID ?? "",
  cognitoIssuer: process.env.EXPO_PUBLIC_COGNITO_ISSUER ?? "",
  awsRegion: process.env.EXPO_PUBLIC_AWS_REGION ?? "",
};

export function isDetectConfigured(): boolean {
  return Boolean(env.detectApiUrl.trim() && env.detectApiKey.trim());
}

/** Cognito + user HTTP API (after BlindNavUserApiStack deploy). */
export function isUserApiConfigured(): boolean {
  return Boolean(
    env.userApiUrl.trim() &&
      env.cognitoUserPoolId.trim() &&
      env.cognitoClientId.trim() &&
      env.cognitoIssuer.trim() &&
      env.awsRegion.trim()
  );
}
