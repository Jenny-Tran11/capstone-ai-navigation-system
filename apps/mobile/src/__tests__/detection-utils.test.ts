// Mocks for modules the hook imports at the top level — not under test here.
import { vi } from 'vitest';

vi.mock('expo-haptics', () => ({ notificationAsync: vi.fn(), impactAsync: vi.fn(), NotificationFeedbackType: {}, ImpactFeedbackStyle: {} }));
vi.mock('expo-speech', () => ({ speak: vi.fn() }));
vi.mock('react-native', () => ({ AppState: { addEventListener: vi.fn(() => ({ remove: vi.fn() })) } }));
vi.mock('@/lib/api-client', () => ({ apiClient: { post: vi.fn() } }));
vi.mock('./detection-api', () => ({ postDetect: vi.fn() }));

import { describe, expect, it } from 'vitest';
import {
  dangerLevel,
  wordOverlap,
} from '../features/detect/use-live-detection';
import type { DetectionResult } from '../features/detect/detection-api';

const det = (name: string): DetectionResult => ({
  name,
  confidence: 0.9,
  box: [0, 0, 1, 1],
});

// ── dangerLevel ───────────────────────────────────────────────────────────────

describe('dangerLevel', () => {
  it('returns "high" for a detection matching DANGER_CLASSES', () => {
    expect(dangerLevel([det('person')])).toBe('high');
    expect(dangerLevel([det('stairs')])).toBe('high');
    expect(dangerLevel([det('curb')])).toBe('high');
  });

  it('returns "medium" for detections matching MEDIUM_CLASSES', () => {
    expect(dangerLevel([det('bicycle')])).toBe('medium');
    expect(dangerLevel([det('car')])).toBe('medium');
    expect(dangerLevel([det('bus')])).toBe('medium');
  });

  it('returns "low" for completely unknown classes', () => {
    expect(dangerLevel([det('tree'), det('bench')])).toBe('low');
  });

  it('prioritises "high" over "medium" when both are present', () => {
    expect(dangerLevel([det('car'), det('person')])).toBe('high');
  });

  it('returns "low" for an empty detection list', () => {
    expect(dangerLevel([])).toBe('low');
  });

  it('is case-insensitive (matches "Person" as high)', () => {
    expect(dangerLevel([det('Person')])).toBe('high');
  });
});

// ── wordOverlap ───────────────────────────────────────────────────────────────

describe('wordOverlap', () => {
  it('returns 1.0 for identical strings', () => {
    expect(wordOverlap('a cat on a mat', 'a cat on a mat')).toBe(1);
  });

  it('returns 0 for completely disjoint strings', () => {
    expect(wordOverlap('apple banana', 'orange grape')).toBe(0);
  });

  it('computes partial overlap correctly', () => {
    // "the cat" vs "the dog" → shared: "the" (1), max(|A|,|B|) = 2 → 0.5
    const overlap = wordOverlap('the cat', 'the dog');
    expect(overlap).toBeCloseTo(0.5);
  });

  it('is case-insensitive', () => {
    expect(wordOverlap('Hello World', 'hello world')).toBe(1);
  });

  it('returns 1 for two empty strings (split yields one empty-string token in each set)', () => {
    expect(wordOverlap('', '')).toBe(1);
  });
});
