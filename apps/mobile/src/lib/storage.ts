import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  RECENT_DESTINATIONS: 'recent_destinations',
  PREFERENCES: 'user_preferences',
  ONBOARDING_DONE: 'onboarding_done',
} as const;

export type Destination = {
  label: string;
  address: string;
  lat: number;
  lng: number;
};

export type UserPreferences = {
  speechRate: number;
  speechLanguage: string;
  verbosity: 'low' | 'medium' | 'high';
  hapticEnabled: boolean;
  detectionIntervalSec: number;
  maxScansPerHour: number;
  preferredLocations: Array<{
    tag: 'home' | 'work' | 'other';
    label: string;
    address: string;
    lat: number;
    lng: number;
  }>;
};

const DEFAULT_PREFS: UserPreferences = {
  speechRate: 1.0,
  speechLanguage: 'en-AU',
  verbosity: 'medium',
  hapticEnabled: true,
  detectionIntervalSec: 10,
  maxScansPerHour: 30,
  preferredLocations: [],
};

export async function getRecentDestinations(): Promise<Destination[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.RECENT_DESTINATIONS);
    return raw ? (JSON.parse(raw) as Destination[]) : [];
  } catch {
    return [];
  }
}

export async function addRecentDestination(dest: Destination): Promise<void> {
  try {
    const existing = await getRecentDestinations();
    const deduped = existing.filter((d) => d.address !== dest.address);
    const updated = [dest, ...deduped].slice(0, 5);
    await AsyncStorage.setItem(
      KEYS.RECENT_DESTINATIONS,
      JSON.stringify(updated),
    );
  } catch {
    // non-fatal — recents are best-effort
  }
}

export async function getPreferences(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PREFERENCES);
    return raw
      ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<UserPreferences>) }
      : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function savePreferences(
  prefs: Partial<UserPreferences>,
): Promise<void> {
  try {
    const current = await getPreferences();
    await AsyncStorage.setItem(
      KEYS.PREFERENCES,
      JSON.stringify({ ...current, ...prefs }),
    );
  } catch {
    // non-fatal — preferences will revert on next launch
  }
}

export async function isOnboardingDone(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEYS.ONBOARDING_DONE)) === 'true';
  } catch {
    return false;
  }
}

export async function markOnboardingDone(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, 'true');
  } catch {
    // non-fatal
  }
}
