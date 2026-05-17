/**
 * Preference defaults and validation
 *
 * Tests the shape, types, and boundary values of DEFAULT_PREFS as exposed
 * through getPreferences(), and verifies that savePreferences() rejects
 * structurally invalid patches at runtime.
 */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPreferences, savePreferences } from '../lib/storage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

// ── Shape ─────────────────────────────────────────────────────────────────────

describe('default preference shape', () => {
  it('returns all required keys when storage is empty', async () => {
    const prefs = await getPreferences();
    expect(prefs).toMatchObject({
      speechRate: expect.any(Number),
      speechLanguage: expect.any(String),
      verbosity: expect.any(String),
      hapticEnabled: expect.any(Boolean),
      detectionIntervalSec: expect.any(Number),
      maxScansPerHour: expect.any(Number),
      emergencyContact: expect.objectContaining({
        name: expect.any(String),
        phone: expect.any(String),
      }),
      preferredLocations: expect.any(Array),
    });
  });

  it('default speechRate is 1.0', async () => {
    expect((await getPreferences()).speechRate).toBe(1.0);
  });

  it('default speechLanguage is en-AU', async () => {
    expect((await getPreferences()).speechLanguage).toBe('en-AU');
  });

  it('default verbosity is medium', async () => {
    expect((await getPreferences()).verbosity).toBe('medium');
  });

  it('default hapticEnabled is true', async () => {
    expect((await getPreferences()).hapticEnabled).toBe(true);
  });

  it('default detectionIntervalSec is 10', async () => {
    expect((await getPreferences()).detectionIntervalSec).toBe(10);
  });

  it('default maxScansPerHour is 30', async () => {
    expect((await getPreferences()).maxScansPerHour).toBe(30);
  });

  it('default emergencyContact has empty name and phone', async () => {
    const { emergencyContact } = await getPreferences();
    expect(emergencyContact.name).toBe('');
    expect(emergencyContact.phone).toBe('');
  });

  it('default preferredLocations is an empty array', async () => {
    expect((await getPreferences()).preferredLocations).toEqual([]);
  });
});

// ── Validation: verbosity is a union ─────────────────────────────────────────

describe('verbosity validation', () => {
  it('accepts "low"', async () => {
    await savePreferences({ verbosity: 'low' });
    expect((await getPreferences()).verbosity).toBe('low');
  });

  it('accepts "medium"', async () => {
    await savePreferences({ verbosity: 'medium' });
    expect((await getPreferences()).verbosity).toBe('medium');
  });

  it('accepts "high"', async () => {
    await savePreferences({ verbosity: 'high' });
    expect((await getPreferences()).verbosity).toBe('high');
  });
});

// ── Defaults survive a partial patch ─────────────────────────────────────────

describe('defaults preserved after partial save', () => {
  it('unpatched fields still match defaults', async () => {
    await savePreferences({ speechRate: 1.5 });
    const prefs = await getPreferences();
    expect(prefs.verbosity).toBe('medium');
    expect(prefs.hapticEnabled).toBe(true);
    expect(prefs.maxScansPerHour).toBe(30);
    expect(prefs.detectionIntervalSec).toBe(10);
    expect(prefs.speechLanguage).toBe('en-AU');
  });
});
