import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { apiClient } from '@/lib/api-client';
import {
  type DetectionResult,
  type DetectResponse,
  postDetect,
} from './detection-api';
import { DANGER_CLASSES, MEDIUM_CLASSES } from './detection-classes';

export function dangerLevel(detections: DetectionResult[]): 'high' | 'medium' | 'low' {
  for (const d of detections) {
    if (DANGER_CLASSES.has(d.name.toLowerCase())) return 'high';
  }
  for (const d of detections) {
    if (MEDIUM_CLASSES.has(d.name.toLowerCase())) return 'medium';
  }
  return 'low';
}

async function fireHaptic(danger: 'high' | 'medium' | 'low'): Promise<void> {
  if (danger === 'high') {
    // short-long pulse pattern for high danger
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    await new Promise((r) => setTimeout(r, 150));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } else if (danger === 'medium') {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } else {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

type Options = {
  intervalSec: number;
  maxScansPerHour: number;
  hapticEnabled: boolean;
  enabled: boolean;
  captureImage: () => Promise<{
    base64: string;
    width: number;
    height: number;
  } | null>;
};

type LiveDetectionState = {
  isRunning: boolean;
  lastDescription: string | null;
  lastDetections: DetectionResult[];
  imageSize: { width: number; height: number } | null;
  errorCount: number;
  reset: () => void;
};

const MIN_TTS_INTERVAL_MS = 2500;
const MAX_CONSECUTIVE_ERRORS = 3;
const SIMILARITY_THRESHOLD = 0.85;

export function wordOverlap(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  let intersection = 0;
  for (const w of setA) if (setB.has(w)) intersection++;
  return intersection / Math.max(setA.size, setB.size, 1);
}

export function useLiveDetection({
  intervalSec,
  maxScansPerHour,
  hapticEnabled,
  enabled,
  captureImage,
}: Options) {
  const [state, setState] = useState<Omit<LiveDetectionState, 'reset'>>({
    isRunning: false,
    lastDescription: null,
    lastDetections: [],
    imageSize: null,
    errorCount: 0,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hourResetRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scansThisHourRef = useRef(0);
  const lastSpeechAtRef = useRef(0);
  const lastDescriptionRef = useRef<string | null>(null);
  const consecutiveErrorsRef = useRef(0);
  const isActiveRef = useRef(true);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    consecutiveErrorsRef.current = 0;
    setState((s) => ({ ...s, errorCount: 0 }));
  }, []);

  const speak = useCallback((text: string) => {
    const now = Date.now();
    if (now - lastSpeechAtRef.current < MIN_TTS_INTERVAL_MS) return;
    if (
      lastDescriptionRef.current !== null &&
      wordOverlap(text, lastDescriptionRef.current) > SIMILARITY_THRESHOLD
    ) {
      return;
    }
    lastSpeechAtRef.current = now;
    lastDescriptionRef.current = text;
    Speech.speak(text, { language: 'en-AU', rate: 1.0 });
  }, []);

  const runOnce = useCallback(async () => {
    if (!isActiveRef.current) return;
    if (scansThisHourRef.current >= maxScansPerHour) return;
    if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
      stopInterval();
      setState((s) => ({ ...s, isRunning: false }));
      return;
    }

    scansThisHourRef.current += 1;

    const capture = await captureImage();
    if (!capture) return;

    const { base64, width: imgWidth, height: imgHeight } = capture;

    try {
      const result: DetectResponse = await postDetect(base64);
      consecutiveErrorsRef.current = 0;
      const desc = result.scene_description;
      setState((s) => ({
        ...s,
        lastDescription: desc,
        lastDetections: result.detections,
        imageSize: { width: imgWidth, height: imgHeight },
        errorCount: 0,
      }));
      speak(desc);
      if (hapticEnabled) {
        await fireHaptic(dangerLevel(result.detections));
      }

      // Fire-and-forget: save to API — silently swallow failures (offline-safe)
      apiClient
        .post('/detection/user', {
          sceneDescription: desc,
          detections: result.detections,
        })
        .catch(() => {});
    } catch (err) {
      consecutiveErrorsRef.current += 1;
      console.warn('[useLiveDetection] detect error:', err);
      setState((s) => ({ ...s, errorCount: s.errorCount + 1 }));
    }
  }, [captureImage, hapticEnabled, maxScansPerHour, speak, stopInterval]);

  useEffect(() => {
    const sub = AppState.addEventListener(
      'change',
      (status: AppStateStatus) => {
        isActiveRef.current = status === 'active';
      },
    );
    return () => sub.remove();
  }, []);

  useEffect(() => {
    hourResetRef.current = setInterval(
      () => {
        scansThisHourRef.current = 0;
      },
      60 * 60 * 1000,
    );
    return () => {
      if (hourResetRef.current) clearInterval(hourResetRef.current);
    };
  }, []);

  useEffect(() => {
    stopInterval();

    if (!enabled) {
      setState((s) => ({ ...s, isRunning: false }));
      return;
    }

    consecutiveErrorsRef.current = 0;
    setState((s) => ({ ...s, isRunning: true, errorCount: 0 }));
    intervalRef.current = setInterval(() => {
      void runOnce();
    }, intervalSec * 1000);

    return stopInterval;
  }, [enabled, intervalSec, runOnce, stopInterval]);

  return { ...state, reset };
}
