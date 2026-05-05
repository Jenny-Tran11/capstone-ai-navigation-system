import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { getPreferences, savePreferences, type UserPreferences } from '@/lib/storage';

type SyncState = 'local' | 'syncing' | 'synced' | 'error';

export function usePreferences() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('local');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: load AsyncStorage immediately, then fetch from API and merge (cloud wins)
  useEffect(() => {
    getPreferences().then(async (local) => {
      setPrefs(local);
      try {
        const { data } = await apiClient.get<Partial<UserPreferences>>('/user-profile/user/preferences');
        const merged: UserPreferences = { ...local, ...data };
        await savePreferences(merged);
        setPrefs(merged);
        setSyncState('synced');
      } catch {
        setSyncState('local');
      }
    });
  }, []);

  const update = useCallback(async (patch: Partial<UserPreferences>) => {
    // Write AsyncStorage synchronously
    await savePreferences(patch);
    setPrefs((prev) => (prev ? { ...prev, ...patch } : prev));
    setSyncState('syncing');

    // Debounce API write
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await apiClient.put('/user-profile/user/preferences', patch);
        setSyncState('synced');
      } catch {
        setSyncState('error');
      }
    }, 800);
  }, []);

  return { prefs, update, syncState };
}
