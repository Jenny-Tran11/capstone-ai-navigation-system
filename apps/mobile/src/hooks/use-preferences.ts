import { useCallback, useEffect, useState } from 'react';
import { getPreferences, savePreferences, type UserPreferences } from '@/lib/storage';

export function usePreferences() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);

  useEffect(() => {
    getPreferences().then(setPrefs);
  }, []);

  const update = useCallback(async (patch: Partial<UserPreferences>) => {
    await savePreferences(patch);
    setPrefs((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  return { prefs, update };
}
