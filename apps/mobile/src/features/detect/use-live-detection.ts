import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { postDetect, type DetectResponse } from './detection-api';

type Options = {
  intervalSec: number;
  maxScansPerHour: number;
  hapticEnabled: boolean;
  enabled: boolean;
  captureImage: () => Promise<string | null>;
};

type LiveDetectionState = {
  isRunning: boolean;
  lastDescription: string | null;
  errorCount: number;
};

const MIN_TTS_INTERVAL_MS = 2500;
const MAX_CONSECUTIVE_ERRORS = 3;
const SIMILARITY_THRESHOLD = 0.85;

function wordOverlap(a: string, b: string): number {
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
  const [state, setState] = useState<LiveDetectionState>({
    isRunning: false,
    lastDescription: null,
    errorCount: 0,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hourResetRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scansThisHourRef = useRef(0);
  const lastSpeechAtRef = useRef(0);
  const lastDescriptionRef = useRef<string | null>(null);
  const consecutiveErrorsRef = useRef(0);
  // Track whether app is in background so we don't run detections offscreen
  const isActiveRef = useRef(true);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
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

    const image = await captureImage();
    if (!image) return;

    try {
      const result: DetectResponse = await postDetect(image);
      consecutiveErrorsRef.current = 0;
      const desc = result.scene_description;
      setState((s) => ({ ...s, lastDescription: desc, errorCount: 0 }));
      speak(desc);
      if (hapticEnabled) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      consecutiveErrorsRef.current += 1;
      console.warn('[useLiveDetection] detect error:', err);
      setState((s) => ({ ...s, errorCount: s.errorCount + 1 }));
    }
  }, [captureImage, hapticEnabled, maxScansPerHour, speak, stopInterval]);

  // Pause when app goes to background, resume when foregrounded
  useEffect(() => {
    const sub = AppState.addEventListener('change', (status: AppStateStatus) => {
      isActiveRef.current = status === 'active';
    });
    return () => sub.remove();
  }, []);

  // Reset hourly scan counter every 60 minutes
  useEffect(() => {
    hourResetRef.current = setInterval(() => {
      scansThisHourRef.current = 0;
    }, 60 * 60 * 1000);
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

  return state;
}
