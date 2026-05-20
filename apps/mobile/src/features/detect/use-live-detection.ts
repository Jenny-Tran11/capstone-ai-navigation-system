import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import {
  type DetectionResult,
  type DetectResponse,
  postDetect,
} from './detection-api';
import { DANGER_CLASSES, MEDIUM_CLASSES } from './detection-classes';
import { apiClient } from '@/lib/api-client';

function dangerLevel(detections: DetectionResult[]): 'high' | 'medium' | 'low' {
  for (const d of detections) {
    if (d.proximity === 'very_near') return 'high';
  }
  for (const d of detections) {
    if (DANGER_CLASSES.has(d.name.toLowerCase())) return 'high';
  }
  for (const d of detections) {
    if (MEDIUM_CLASSES.has(d.name.toLowerCase())) return 'medium';
  }
  return 'low';
}

function directionFromBox(
  box: [number, number, number, number],
  imageWidth: number,
): 'left' | 'center' | 'right' {
  const centerX = (box[0] + box[2]) / 2;
  const third = Math.max(1, imageWidth) / 3;
  if (centerX < third) return 'left';
  if (centerX > third * 2) return 'right';
  return 'center';
}

function buildDetailedPrompt(
  detections: DetectionResult[],
  imageWidth: number,
): string {
  if (!detections.length) return 'Path is clear.';

  const rank = (d: DetectionResult): number => {
    const [x1, y1, x2, y2] = d.box;
    const area = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const proximityScore =
      d.proximity === 'very_near' ? 100 : d.proximity === 'near' ? 60 : 20;
    return proximityScore + area + d.confidence * 10;
  };

  const sorted = [...detections].sort((a, b) => rank(b) - rank(a)).slice(0, 3);
  const lead = sorted[0];
  const leadDir = directionFromBox(lead.box, imageWidth);
  const leadUrgency =
    lead.proximity === 'very_near'
      ? 'Warning. Very close'
      : lead.proximity === 'near'
        ? 'Caution. Nearby'
        : 'Detected';

  const extras = sorted.slice(1).map((d) => {
    const dir = directionFromBox(d.box, imageWidth);
    return `${d.name} ${dir}`;
  });

  const extraPart = extras.length ? `. Also ${extras.join(', ')}` : '';
  return `${leadUrgency} ${lead.name} ${leadDir}${extraPart}.`;
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
  speechRate: number;
  speechLanguage: string;
  captureImage: () => Promise<{
    base64: string;
    uri: string;
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
  requestCount: number;
  lastError: string | null;
  lastSuccessAt: number | null;
  triggerNow: () => Promise<void>;
  reset: () => void;
};

const MAX_CONSECUTIVE_ERRORS = 3;

export function useLiveDetection({
  intervalSec,
  maxScansPerHour,
  hapticEnabled,
  enabled,
  speechRate,
  speechLanguage,
  captureImage,
}: Options) {
  const [state, setState] = useState<Omit<LiveDetectionState, 'reset'>>({
    isRunning: false,
    lastDescription: null,
    lastDetections: [],
    imageSize: null,
    errorCount: 0,
    requestCount: 0,
    lastError: null,
    lastSuccessAt: null,
    triggerNow: async () => {},
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hourResetRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scansThisHourRef = useRef(0);
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

  const speak = useCallback(
    (text: string) => {
      Speech.speak(text, { language: speechLanguage, rate: speechRate });
    },
    [speechLanguage, speechRate],
  );

  const runOnce = useCallback(async () => {
    if (!isActiveRef.current) return;
    const safeMaxScans = Math.max(1, maxScansPerHour || 30);
    if (scansThisHourRef.current >= safeMaxScans) return;
    if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
      stopInterval();
      setState((s) => ({ ...s, isRunning: false }));
      return;
    }

    scansThisHourRef.current += 1;
    setState((s) => ({ ...s, requestCount: s.requestCount + 1 }));

    const capture = await captureImage();
    if (!capture) {
      setState((s) => ({
        ...s,
        errorCount: s.errorCount + 1,
        lastError: 'Camera capture failed (no frame/base64)',
      }));
      return;
    }

    const { base64, width: imgWidth, height: imgHeight } = capture;

    try {
      const result: DetectResponse = await postDetect(base64);
      const danger = dangerLevel(result.detections);
      consecutiveErrorsRef.current = 0;
      const desc = buildDetailedPrompt(result.detections, imgWidth);
      setState((s) => ({
        ...s,
        lastDescription: desc,
        lastDetections: result.detections,
        imageSize: { width: imgWidth, height: imgHeight },
        errorCount: 0,
        lastError: null,
        lastSuccessAt: Date.now(),
      }));
      speak(desc);
      if (danger === 'high' || danger === 'medium') {
        try {
          await apiClient.post('/detection/user', {
            sceneDescription: result.scene_description || desc,
            detections: result.detections,
          });
        } catch (saveErr) {
          if (__DEV__) {
            console.warn('[useLiveDetection] save hazard failed:', saveErr);
          }
        }
      }
      if (hapticEnabled) {
        await fireHaptic(danger);
      }
    } catch (err) {
      consecutiveErrorsRef.current += 1;
      if (__DEV__) {
        console.warn('[useLiveDetection] detect error:', err);
      }
      setState((s) => ({
        ...s,
        errorCount: s.errorCount + 1,
        lastError: err instanceof Error ? err.message : 'Detect request failed',
      }));
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
    // Trigger immediately so users don't wait for the first interval tick.
    void runOnce();
    intervalRef.current = setInterval(() => {
      void runOnce();
    }, Math.max(2, intervalSec || 10) * 1000);

    return stopInterval;
  }, [enabled, intervalSec, runOnce, stopInterval]);

  return { ...state, reset, triggerNow: runOnce };
}
