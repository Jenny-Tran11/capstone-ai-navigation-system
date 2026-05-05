import { Amplify } from 'aws-amplify';

const cognitoEndpoint = process.env.EXPO_PUBLIC_COGNITO_ENDPOINT;
const userPoolId = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID ?? '';
const userPoolClientId = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID ?? '';

if (cognitoEndpoint) {
  const cognitoPattern = /https:\/\/cognito-idp\.[^.]+\.amazonaws\.com/;
  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (cognitoPattern.test(url)) {
      return originalFetch(url.replace(cognitoPattern, cognitoEndpoint), init);
    }
    return originalFetch(input, init);
  };
}

export function configureAmplify() {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        ...(cognitoEndpoint ? { userPoolEndpoint: cognitoEndpoint } : {}),
        loginWith: { email: true },
      },
    },
  });
}

configureAmplify();
