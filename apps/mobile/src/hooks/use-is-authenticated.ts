import { useEffect, useState } from 'react';

/**
 * Returns true when authenticated, false when not, null while loading.
 * Replace the stub below with your Amplify / Cognito session check.
 */
export function useIsAuthenticated(): boolean | null {
  const [state, setState] = useState<boolean | null>(null);

  useEffect(() => {
    // TODO: replace with real Cognito session check via aws-amplify
    // fetchAuthSession().then(session => setState(!!session.tokens?.idToken))
    setState(true); // dev stub: always authenticated
  }, []);

  return state;
}
