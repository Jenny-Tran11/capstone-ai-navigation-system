import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SosTrigger } from '@/components/SosTrigger';
import { usePreferences } from '@/hooks/use-preferences';
import { BoundingBoxOverlay } from './BoundingBoxOverlay';
import { CrossingBanner } from './CrossingBanner';
import { postCrossingDetect, type SignalState } from './crossing-api';
import { useLiveDetection } from './use-live-detection';

type ViewSize = { width: number; height: number };

const MAX_ERRORS_BEFORE_PAUSE = 3;
const MAX_UPLOAD_DIMENSION = 960;

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#000000',
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DetectScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const capturingRef = useRef(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [active, setActive] = useState(false);
  const [viewSize, setViewSize] = useState<ViewSize | null>(null);
  const { prefs } = usePreferences();
  const speechRate = prefs?.speechRate ?? 1.0;
  const speechLang = prefs?.speechLanguage ?? 'en-AU';

  // Crossing scan counter for rate limiting (reset hourly)
  const crossingScansRef = useRef(0);

  useEffect(() => {
    const id = setInterval(
      () => {
        crossingScansRef.current = 0;
      },
      60 * 60 * 1000,
    );
    return () => clearInterval(id);
  }, []);

  // Crossing mode state
  const [signal, setSignal] = useState<SignalState>('none');
  const prevSignalRef = useRef<SignalState>('none');

  // Voice feedback when detection starts, stops, or pauses
  const prevActiveRef = useRef(false);
  const prevPausedRef = useRef(false);

  const captureImage = useCallback(async () => {
    if (!cameraRef.current || !cameraReady || capturingRef.current) return null;
    capturingRef.current = true;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.35,
        skipProcessing: true,
        shutterSound: false,
        exif: false,
      });
      if (!photo?.base64 || !photo?.uri) return null;

      let outBase64 = photo.base64;
      let outWidth = photo.width ?? 1;
      let outHeight = photo.height ?? 1;

      const longestSide = Math.max(outWidth, outHeight);
      if (longestSide > MAX_UPLOAD_DIMENSION) {
        const scale = MAX_UPLOAD_DIMENSION / longestSide;
        const targetWidth = Math.max(1, Math.round(outWidth * scale));
        const targetHeight = Math.max(1, Math.round(outHeight * scale));
        const resized = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: targetWidth, height: targetHeight } }],
          {
            compress: 0.65,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          },
        );
        if (resized.base64) outBase64 = resized.base64;
        outWidth = resized.width;
        outHeight = resized.height;
      }

      return {
        base64: outBase64,
        uri: photo.uri,
        width: outWidth,
        height: outHeight,
      };
    } catch {
      return null;
    } finally {
      capturingRef.current = false;
    }
  }, [cameraReady]);

  // ── Obstacle detection (existing hook) ──────────────────────────────────────
  const {
    isRunning,
    lastDescription,
    lastDetections,
    imageSize,
    errorCount,
    reset,
  } = useLiveDetection({
    intervalSec: prefs?.detectionIntervalSec ?? 10,
    maxScansPerHour: prefs?.maxScansPerHour ?? 30,
    hapticEnabled: prefs?.hapticEnabled ?? true,
    enabled: active && cameraReady,
    speechRate,
    speechLanguage: speechLang,
    captureImage,
  });

  useEffect(() => {
    const paused = errorCount >= MAX_ERRORS_BEFORE_PAUSE;
    if (active && !prevActiveRef.current) {
      Speech.speak('Detection started.', {
        language: speechLang,
        rate: speechRate,
      });
    } else if (!active && prevActiveRef.current && !paused) {
      Speech.speak('Detection stopped.', {
        language: speechLang,
        rate: speechRate,
      });
    }
    if (paused && !prevPausedRef.current) {
      Speech.speak('Detection paused. Check connection, then tap Retry.', {
        language: speechLang,
        rate: speechRate,
      });
    }
    prevActiveRef.current = active;
    prevPausedRef.current = paused;
  }, [active, errorCount, speechLang, speechRate]);

  // ── Crossing detection — always ambient when camera is active ───────────────
  // Runs regardless of mode: blind users can't know where a traffic light is,
  // so the app proactively announces signals whenever they enter the frame.
  useEffect(() => {
    if (!active || !cameraReady) return;

    const run = async () => {
      if (crossingScansRef.current >= (prefs?.maxScansPerHour ?? 30)) return;
      crossingScansRef.current += 1;
      const capture = await captureImage();
      if (!capture) return;
      try {
        const result = await postCrossingDetect(capture.base64);
        setSignal(result.signal);

        if (
          result.signal !== 'none' &&
          result.signal !== prevSignalRef.current
        ) {
          const text =
            result.signal === 'walk'
              ? 'Walk signal'
              : "Don't walk signal, wait";
          Speech.speak(text, { language: speechLang, rate: speechRate });
          if (prefs?.hapticEnabled ?? true) {
            result.signal === 'walk'
              ? Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                )
              : Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Warning,
                );
          }
        }
        prevSignalRef.current = result.signal;
      } catch {
        // silently ignore crossing API errors
      }
    };

    void run();
    const id = setInterval(() => void run(), 2000);
    return () => {
      clearInterval(id);
      setSignal('none');
      prevSignalRef.current = 'none';
    };
  }, [
    active,
    cameraReady,
    captureImage,
    prefs?.hapticEnabled,
    prefs?.maxScansPerHour,
    speechRate,
    speechLang,
  ]);

  const handleCameraLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setViewSize({ width, height });
  }, []);

  // ── Permission screens ───────────────────────────────────────────────────────
  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="white" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-900 p-6">
        <Text className="text-white text-xl font-semibold mb-4 text-center">
          Camera access required
        </Text>
        <Text className="text-gray-400 text-sm text-center mb-8">
          AI-Detect needs camera access to identify obstacles around you.
        </Text>
        <Pressable
          onPress={requestPermission}
          className="bg-primary px-8 py-4 rounded-2xl"
          accessibilityRole="button"
          accessibilityLabel="Grant camera access"
        >
          <Text className="text-white font-semibold text-lg">Grant access</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const paused = errorCount >= MAX_ERRORS_BEFORE_PAUSE;
  const running = isRunning;

  return (
    <View style={styles.screenRoot}>
      {/* Native layout only: CameraView does not apply NativeWind className reliably. */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
        onLayout={handleCameraLayout}
      />

      {/* Obstacle detections: bounding boxes */}
      {viewSize &&
      imageSize &&
      lastDetections.length > 0 ? (
        <BoundingBoxOverlay
          detections={lastDetections}
          imageSize={imageSize}
          viewSize={viewSize}
        />
      ) : null}

      {/* Detection count badge */}
      {lastDetections.length > 0 ? (
        <View className="absolute top-12 right-4 bg-primary rounded-full w-10 h-10 items-center justify-center">
          <Text className="text-white font-bold text-sm">
            {lastDetections.length}
          </Text>
        </View>
      ) : null}

      {/* SOS button — top-left, always accessible */}
      <View style={{ position: 'absolute', top: 48, left: 16 }} pointerEvents="box-none">
        <SosTrigger
          contactPhone={prefs?.emergencyContact?.phone}
          contactName={prefs?.emergencyContact?.name}
        />
      </View>

      {/* Crossing signal banner — always shown when active, any mode */}
      <CrossingBanner signal={signal} />

      {/* Bottom controls */}
      <View className="absolute inset-x-0 bottom-0 pb-12 px-6 items-center gap-4">
        {/* Latest description */}
        {lastDescription ? (
          <View className="bg-black/70 rounded-2xl px-4 py-3 max-w-sm">
            <Text className="text-white text-base text-center">
              {lastDescription}
            </Text>
          </View>
        ) : null}

        {/* Paused error + retry */}
        {paused ? (
          <View className="items-center gap-2">
            <View className="bg-red-500/80 rounded-xl px-4 py-2">
              <Text className="text-white text-sm text-center">
                Detection paused — check API connection
              </Text>
            </View>
            <Pressable
              onPress={() => {
                reset();
                setActive(true);
              }}
              className="bg-white/20 rounded-xl px-5 py-2"
              accessibilityRole="button"
              accessibilityLabel="Retry detection"
            >
              <Text className="text-white text-sm font-semibold">Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Idle hints */}
        {!active && !paused ? (
          <View className="bg-black/70 rounded-2xl px-4 py-3 max-w-sm">
            <Text className="text-white text-base text-center">
              Tap Start — obstacles and crossing signals are detected automatically
            </Text>
          </View>
        ) : null}

        {/* Start / Stop button (hidden when paused — Retry button above takes over) */}
        {!paused ? (
          <Pressable
            onPress={() => setActive((v) => !v)}
            className={[
              'w-20 h-20 rounded-full items-center justify-center',
              running ? 'bg-red-500' : 'bg-primary',
            ].join(' ')}
            accessibilityLabel={running ? 'Stop detection' : 'Start detection'}
            accessibilityRole="button"
          >
            <Text className="text-white text-sm font-bold">
              {running ? 'STOP' : 'START'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
