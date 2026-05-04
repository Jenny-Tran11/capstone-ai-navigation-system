import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import { postDetect, type DetectResponse } from './detection-api';

type Options = {
  intervalSec: number;
  maxScansPerHour: number;
  enabled: boolean;
  captureImage: () => Promise<string | null>; // returns base64 or null
};

type State = {
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
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  return intersection / Math.max(setA.size, setB.size, 1);
}

export function useLiveDetection({ intervalSec, maxScansPerHour, enabled, captureImage }: Options) {
  const [state, setState] = useState<State>({ isRunning: false, lastDescription: null, errorCount: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scansThisHourRef = useRef(0);
  const hourResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSpeechRef = useRef(0);
  const lastDescRef = useRef<string | null>(null);
  const consecutiveErrorsRef = useRef(0);

  const speak = useCallback((text: string) => {
    const now = Date.now();
    if (now - lastSpeechRef.current < MIN_TTS_INTERVAL_MS) return;
    if (lastDescRef.current && wordOverlap(text, lastDescRef.current) > SIMILARITY_THRESHOLD) return;
    lastSpeechRef.current = now;
    lastDescRef.current = text;
    Speech.speak(text, { language: 'en-AU', rate: 1.0 });
  }, []);

  const runOnce = useCallback(async () => {
    if (scansThisHourRef.current >= maxScansPerHour) return;
    if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
      setState((s) => ({ ...s, isRunning: false }));
      return;
    }

    scansThisHourRef.current++;

    const image = await captureImage();
    if (!image) return;

    try {
      const result: DetectResponse = await postDetect(image);
      consecutiveErrorsRef.current = 0;
      const desc = result.scene_description;
      setState((s) => ({ ...s, lastDescription: desc, errorCount: 0 }));
      speak(desc);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      consecutiveErrorsRef.current++;
      setState((s) => ({ ...s, errorCount: s.errorCount + 1 }));
    }
  }, [captureImage, maxScansPerHour, speak]);

  useEffect(() => {
    if (!enabled) {
      setState((s) => ({ ...s, isRunning: false }));
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setState((s) => ({ ...s, isRunning: true }));
    timerRef.current = setInterval(runOnce, intervalSec * 1000);

    // Reset hourly scan counter every 60 minutes
    hourResetRef.current = setInterval(() => {
      scansThisHourRef.current = 0;
    }, 60 * 60 * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (hourResetRef.current) clearInterval(hourResetRef.current);
    };
  }, [enabled, intervalSec, runOnce]);

  return state;
}
