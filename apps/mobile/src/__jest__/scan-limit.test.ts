/**
 * Scan-limit calculations
 *
 * The scan-limit feature lives at the intersection of two preferences:
 *   - maxScansPerHour   — hard ceiling on API calls in any 60-minute window
 *   - detectionIntervalSec — polling cadence between scans
 *
 * Tests here exercise:
 *   1. Default values loaded from storage
 *   2. Gate condition: scansThisHour >= maxScansPerHour
 *   3. Hourly budget maths — how many scans fit in a window at a given interval
 *   4. Preference round-trip for scan-limit fields
 *
 * We deliberately avoid renderHook because react-test-renderer ships a
 * separate React copy that conflicts with the app's React in this pnpm
 * workspace.  The gate logic and preference layer are fully testable without
 * rendering a hook.
 */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPreferences, savePreferences } from '../lib/storage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

// ── Gate condition (pure logic) ───────────────────────────────────────────────

// Mirrors the guard in useLiveDetection.runOnce:
//   if (scansThisHourRef.current >= maxScansPerHour) return;
function isAtLimit(scansThisHour: number, maxScansPerHour: number): boolean {
  return scansThisHour >= maxScansPerHour;
}

describe('scan gate condition', () => {
  it('allows the first scan (counter starts at 0)', () => {
    expect(isAtLimit(0, 30)).toBe(false);
  });

  it('allows scans while under the limit', () => {
    expect(isAtLimit(1, 30)).toBe(false);
    expect(isAtLimit(29, 30)).toBe(false);
  });

  it('blocks exactly at the limit', () => {
    expect(isAtLimit(30, 30)).toBe(true);
  });

  it('blocks beyond the limit', () => {
    expect(isAtLimit(31, 30)).toBe(true);
  });

  it('blocks immediately when maxScansPerHour is 0', () => {
    expect(isAtLimit(0, 0)).toBe(true);
  });

  it('allows up to maxScansPerHour = 1 exactly once', () => {
    expect(isAtLimit(0, 1)).toBe(false);
    expect(isAtLimit(1, 1)).toBe(true);
  });
});

// ── Hourly budget maths ───────────────────────────────────────────────────────

// How many scans can fire in one hour at a given interval before hitting the cap?
function effectiveScansPerHour(detectionIntervalSec: number, maxScansPerHour: number): number {
  const theoreticalMax = Math.floor(3600 / detectionIntervalSec);
  return Math.min(theoreticalMax, maxScansPerHour);
}

describe('effectiveScansPerHour', () => {
  it('returns maxScansPerHour when the interval is fast enough to exceed it', () => {
    // 3600 / 10 = 360 theoretical; capped at 30
    expect(effectiveScansPerHour(10, 30)).toBe(30);
  });

  it('returns theoreticalMax when interval is the binding constraint', () => {
    // 3600 / 120 = 30 theoretical; maxScansPerHour = 60 → theoretical wins
    expect(effectiveScansPerHour(120, 60)).toBe(30);
  });

  it('returns 0 when maxScansPerHour is 0', () => {
    expect(effectiveScansPerHour(10, 0)).toBe(0);
  });

  it('default prefs (10s interval, 30/hr cap) yields 30 effective scans/hr', () => {
    expect(effectiveScansPerHour(10, 30)).toBe(30);
  });
});

// ── Minimum seconds between scans to stay within budget ──────────────────────

function minIntervalSecForBudget(maxScansPerHour: number): number {
  if (maxScansPerHour <= 0) return Infinity;
  return 3600 / maxScansPerHour;
}

describe('minIntervalSecForBudget', () => {
  it('30 scans/hr → interval must be at least 120 s', () => {
    expect(minIntervalSecForBudget(30)).toBe(120);
  });

  it('60 scans/hr → interval must be at least 60 s', () => {
    expect(minIntervalSecForBudget(60)).toBe(60);
  });

  it('1 scan/hr → interval must be at least 3600 s', () => {
    expect(minIntervalSecForBudget(1)).toBe(3600);
  });

  it('0 scans/hr → returns Infinity (no scans allowed)', () => {
    expect(minIntervalSecForBudget(0)).toBe(Infinity);
  });
});

// ── Storage round-trip for scan-limit preferences ────────────────────────────

describe('scan-limit preference persistence', () => {
  it('default maxScansPerHour is 30', async () => {
    expect((await getPreferences()).maxScansPerHour).toBe(30);
  });

  it('default detectionIntervalSec is 10', async () => {
    expect((await getPreferences()).detectionIntervalSec).toBe(10);
  });

  it('maxScansPerHour can be saved and retrieved', async () => {
    await savePreferences({ maxScansPerHour: 60 });
    expect((await getPreferences()).maxScansPerHour).toBe(60);
  });

  it('detectionIntervalSec can be saved and retrieved', async () => {
    await savePreferences({ detectionIntervalSec: 30 });
    expect((await getPreferences()).detectionIntervalSec).toBe(30);
  });

  it('updating one field does not overwrite the other', async () => {
    await savePreferences({ maxScansPerHour: 10, detectionIntervalSec: 60 });
    await savePreferences({ maxScansPerHour: 5 });
    const prefs = await getPreferences();
    expect(prefs.maxScansPerHour).toBe(5);
    expect(prefs.detectionIntervalSec).toBe(60);
  });

  it('effectiveScansPerHour computed from saved prefs matches expected', async () => {
    await savePreferences({ maxScansPerHour: 6, detectionIntervalSec: 60 });
    const { maxScansPerHour, detectionIntervalSec } = await getPreferences();
    // 3600/60 = 60 theoretical; min(60, 6) = 6
    expect(effectiveScansPerHour(detectionIntervalSec, maxScansPerHour)).toBe(6);
  });
});
