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
};

const DEFAULT_PREFS: UserPreferences = {
  speechRate: 1.0,
  speechLanguage: 'en-AU',
  verbosity: 'medium',
  hapticEnabled: true,
  detectionIntervalSec: 10,
  maxScansPerHour: 30,
};

export async function getRecentDestinations(): Promise<Destination[]> {
  const raw = await AsyncStorage.getItem(KEYS.RECENT_DESTINATIONS);
  return raw ? (JSON.parse(raw) as Destination[]) : [];
}

export async function addRecentDestination(dest: Destination): Promise<void> {
  const existing = await getRecentDestinations();
  const deduped = existing.filter((d) => d.address !== dest.address);
  const updated = [dest, ...deduped].slice(0, 5);
  await AsyncStorage.setItem(KEYS.RECENT_DESTINATIONS, JSON.stringify(updated));
}

export async function getPreferences(): Promise<UserPreferences> {
  const raw = await AsyncStorage.getItem(KEYS.PREFERENCES);
  return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<UserPreferences>) } : DEFAULT_PREFS;
}

export async function savePreferences(prefs: Partial<UserPreferences>): Promise<void> {
  const current = await getPreferences();
  await AsyncStorage.setItem(KEYS.PREFERENCES, JSON.stringify({ ...current, ...prefs }));
}

export async function isOnboardingDone(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.ONBOARDING_DONE)) === 'true';
}

export async function markOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, 'true');
}
