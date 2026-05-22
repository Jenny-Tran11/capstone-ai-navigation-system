/**
 * Local save/load behavior via AsyncStorage
 *
 * Uses the official @react-native-async-storage mock to exercise
 * getPreferences / savePreferences / addRecentDestination round-trips
 * through the real in-memory AsyncStorage substitute.
 */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addRecentDestination,
  getPreferences,
  getRecentDestinations,
  isOnboardingDone,
  markOnboardingDone,
  savePreferences,
} from '../lib/storage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

// ── savePreferences / getPreferences ─────────────────────────────────────────

describe('savePreferences → getPreferences round-trip', () => {
  it('persists a full patch and reads it back', async () => {
    await savePreferences({ speechRate: 1.8, verbosity: 'high', hapticEnabled: false });
    const prefs = await getPreferences();
    expect(prefs.speechRate).toBe(1.8);
    expect(prefs.verbosity).toBe('high');
    expect(prefs.hapticEnabled).toBe(false);
  });

  it('successive patches accumulate without clobbering', async () => {
    await savePreferences({ speechRate: 0.5 });
    await savePreferences({ hapticEnabled: false });
    await savePreferences({ maxScansPerHour: 60 });
    const prefs = await getPreferences();
    expect(prefs.speechRate).toBe(0.5);
    expect(prefs.hapticEnabled).toBe(false);
    expect(prefs.maxScansPerHour).toBe(60);
  });

  it('persists emergencyContact object', async () => {
    await savePreferences({ emergencyContact: { name: 'Alice', phone: '0412 345 678' } });
    const { emergencyContact } = await getPreferences();
    expect(emergencyContact.name).toBe('Alice');
    expect(emergencyContact.phone).toBe('0412 345 678');
  });

  it('overwrites a previously stored key when patched again', async () => {
    await savePreferences({ speechLanguage: 'en-US' });
    await savePreferences({ speechLanguage: 'fr-FR' });
    expect((await getPreferences()).speechLanguage).toBe('fr-FR');
  });

  it('survives an AsyncStorage.getItem returning null (first launch)', async () => {
    const prefs = await getPreferences();
    expect(prefs).toBeDefined();
    expect(typeof prefs.speechRate).toBe('number');
  });
});

// ── Corrupt storage falls back to defaults ────────────────────────────────────

describe('corrupt storage handling', () => {
  it('returns defaults when stored JSON is malformed', async () => {
    (AsyncStorage.setItem as jest.Mock)('user_preferences', 'NOT_VALID_JSON{{{');
    const prefs = await getPreferences();
    expect(prefs.speechRate).toBe(1.0);
    expect(prefs.verbosity).toBe('medium');
  });
});

// ── Recent destinations ───────────────────────────────────────────────────────

describe('addRecentDestination → getRecentDestinations', () => {
  const dest = (n: number) => ({
    label: `Place ${n}`,
    address: `${n} Main St`,
    lat: -33 + n * 0.01,
    lng: 151 + n * 0.01,
  });

  it('stores one destination and retrieves it', async () => {
    await addRecentDestination(dest(1));
    const list = await getRecentDestinations();
    expect(list).toHaveLength(1);
    expect(list[0].address).toBe('1 Main St');
  });

  it('most recently added appears first', async () => {
    await addRecentDestination(dest(1));
    await addRecentDestination(dest(2));
    expect((await getRecentDestinations())[0].address).toBe('2 Main St');
  });

  it('deduplicates by address, keeping the newest entry at the front', async () => {
    await addRecentDestination(dest(1));
    await addRecentDestination({ ...dest(1), label: 'Updated Label' });
    const list = await getRecentDestinations();
    expect(list).toHaveLength(1);
    expect(list[0].label).toBe('Updated Label');
  });

  it('caps the list at 5, dropping the oldest', async () => {
    for (let i = 1; i <= 7; i++) await addRecentDestination(dest(i));
    const list = await getRecentDestinations();
    expect(list).toHaveLength(5);
    expect(list[0].address).toBe('7 Main St');
    expect(list.map((d) => d.address)).not.toContain('1 Main St');
    expect(list.map((d) => d.address)).not.toContain('2 Main St');
  });
});

// ── Onboarding flag ───────────────────────────────────────────────────────────

describe('onboarding persistence', () => {
  it('returns false before markOnboardingDone', async () => {
    expect(await isOnboardingDone()).toBe(false);
  });

  it('returns true after markOnboardingDone', async () => {
    await markOnboardingDone();
    expect(await isOnboardingDone()).toBe(true);
  });

  it('onboarding flag persists across multiple reads', async () => {
    await markOnboardingDone();
    expect(await isOnboardingDone()).toBe(true);
    expect(await isOnboardingDone()).toBe(true);
  });
});
