import { beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory AsyncStorage substitute — hoisted so the factory can close over it.
const store = vi.hoisted(() => new Map<string, string>());

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: (key: string) => Promise.resolve(store.get(key) ?? null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      store.delete(key);
      return Promise.resolve();
    },
  },
}));

// Import after mock is wired up.
import {
  addRecentDestination,
  getPreferences,
  getRecentDestinations,
  isOnboardingDone,
  markOnboardingDone,
  savePreferences,
} from '../lib/storage';

beforeEach(() => store.clear());

// ── Preference defaults ───────────────────────────────────────────────────────

describe('getPreferences — defaults', () => {
  it('returns DEFAULT_PREFS when storage is empty', async () => {
    const prefs = await getPreferences();
    expect(prefs.speechRate).toBe(1.0);
    expect(prefs.speechLanguage).toBe('en-AU');
    expect(prefs.verbosity).toBe('medium');
    expect(prefs.hapticEnabled).toBe(true);
    expect(prefs.detectionIntervalSec).toBe(10);
    expect(prefs.maxScansPerHour).toBe(30);
    expect(prefs.emergencyContact).toEqual({ name: '', phone: '' });
    expect(prefs.preferredLocations).toEqual([]);
  });

  it('merges stored partial prefs with defaults, stored value wins', async () => {
    store.set(
      'user_preferences',
      JSON.stringify({ speechRate: 1.5, hapticEnabled: false }),
    );
    const prefs = await getPreferences();
    expect(prefs.speechRate).toBe(1.5);
    expect(prefs.hapticEnabled).toBe(false);
    // Fields not in stored object still come from defaults.
    expect(prefs.maxScansPerHour).toBe(30);
    expect(prefs.verbosity).toBe('medium');
  });
});

// ── Save / load round-trip ───────────────────────────────────────────────────

describe('savePreferences + getPreferences', () => {
  it('persists a patch and reads it back', async () => {
    await savePreferences({ speechLanguage: 'en-US', maxScansPerHour: 60 });
    const prefs = await getPreferences();
    expect(prefs.speechLanguage).toBe('en-US');
    expect(prefs.maxScansPerHour).toBe(60);
  });

  it('merges successive patches without clobbering unrelated fields', async () => {
    await savePreferences({ hapticEnabled: false });
    await savePreferences({ speechRate: 0.8 });
    const prefs = await getPreferences();
    expect(prefs.hapticEnabled).toBe(false);
    expect(prefs.speechRate).toBe(0.8);
  });
});

// ── Recent destinations ──────────────────────────────────────────────────────

const dest = (n: number) => ({
  label: `Place ${n}`,
  address: `${n} Main St`,
  lat: n,
  lng: n,
});

describe('addRecentDestination', () => {
  it('stores a destination and retrieves it', async () => {
    await addRecentDestination(dest(1));
    const recents = await getRecentDestinations();
    expect(recents).toHaveLength(1);
    expect(recents[0].address).toBe('1 Main St');
  });

  it('deduplicates by address, keeping the newest at front', async () => {
    await addRecentDestination(dest(1));
    await addRecentDestination(dest(2));
    await addRecentDestination({ ...dest(1), label: 'Updated' });
    const recents = await getRecentDestinations();
    expect(recents[0].label).toBe('Updated');
    expect(recents.filter((d) => d.address === '1 Main St')).toHaveLength(1);
  });

  it('caps the list at 5 entries, dropping the oldest', async () => {
    for (let i = 1; i <= 7; i++) await addRecentDestination(dest(i));
    const recents = await getRecentDestinations();
    expect(recents).toHaveLength(5);
    expect(recents[0].address).toBe('7 Main St');
  });
});

// ── Onboarding flag ──────────────────────────────────────────────────────────

describe('onboarding status', () => {
  it('returns false before markOnboardingDone is called', async () => {
    expect(await isOnboardingDone()).toBe(false);
  });

  it('returns true after markOnboardingDone', async () => {
    await markOnboardingDone();
    expect(await isOnboardingDone()).toBe(true);
  });
});
