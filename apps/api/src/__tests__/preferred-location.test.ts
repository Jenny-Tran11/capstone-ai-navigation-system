import { describe, expect, it, vi } from 'vitest';

vi.mock('../baseblocks/user-profile/user-profile.service', () => ({
  userProfileService: { get: vi.fn(), getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

import {
  normalizePreferredLocations,
  toPreferredLocation,
} from '../baseblocks/user-profile/user-profile-user-preferences-api';

const valid = {
  tag: 'home' as const,
  label: 'My House',
  address: '1 Main St',
  lat: -33.87,
  lng: 151.21,
};

// ── toPreferredLocation ───────────────────────────────────────────────────────

describe('toPreferredLocation', () => {
  it('returns a clean object for valid input', () => {
    expect(toPreferredLocation(valid)).toEqual(valid);
  });

  it('trims whitespace from label and address', () => {
    const result = toPreferredLocation({ ...valid, label: '  Work  ', address: '  2 High St  ' });
    expect(result?.label).toBe('Work');
    expect(result?.address).toBe('2 High St');
  });

  it('returns null for an invalid tag', () => {
    expect(toPreferredLocation({ ...valid, tag: 'office' })).toBeNull();
  });

  it('returns null for an empty label', () => {
    expect(toPreferredLocation({ ...valid, label: '   ' })).toBeNull();
  });

  it('returns null for an empty address', () => {
    expect(toPreferredLocation({ ...valid, address: '' })).toBeNull();
  });

  it('returns null for non-finite lat', () => {
    expect(toPreferredLocation({ ...valid, lat: Number.NaN })).toBeNull();
    expect(toPreferredLocation({ ...valid, lat: Number.POSITIVE_INFINITY })).toBeNull();
  });

  it('returns null for non-numeric lat', () => {
    expect(toPreferredLocation({ ...valid, lat: '51.5' })).toBeNull();
  });

  it('returns null for a non-object value', () => {
    expect(toPreferredLocation(null)).toBeNull();
    expect(toPreferredLocation('string')).toBeNull();
  });
});

// ── normalizePreferredLocations ───────────────────────────────────────────────

describe('normalizePreferredLocations', () => {
  it('returns an empty array for a non-array input', () => {
    expect(normalizePreferredLocations(null)).toEqual([]);
    expect(normalizePreferredLocations('bad')).toEqual([]);
  });

  it('filters out invalid entries', () => {
    const result = normalizePreferredLocations([valid, { tag: 'bad' }]);
    expect(result).toHaveLength(1);
  });

  it('deduplicates by tag, keeping the last occurrence', () => {
    const first = { ...valid, label: 'Old Home' };
    const second = { ...valid, label: 'New Home' };
    const result = normalizePreferredLocations([first, second]);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('New Home');
  });

  it('caps output at 3 entries', () => {
    const entries = [
      { ...valid, tag: 'home' as const },
      { ...valid, tag: 'work' as const },
      { ...valid, tag: 'other' as const },
      { ...valid, tag: 'home' as const, label: 'Extra' },
    ];
    const result = normalizePreferredLocations(entries);
    expect(result.length).toBeLessThanOrEqual(3);
  });
});
