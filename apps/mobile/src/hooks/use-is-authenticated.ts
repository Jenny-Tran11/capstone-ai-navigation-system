import '@/lib/amplify';
import { fetchAuthSession } from '@aws-amplify/auth';
import { useEffect, useState } from 'react';

export function useIsAuthenticated(): boolean | null {
  const [state, setState] = useState<boolean | null>(null);

  useEffect(() => {
    fetchAuthSession()
      .then((session) => setState(!!session.tokens?.idToken))
      .catch(() => setState(false));
  }, []);

  return state;
}
