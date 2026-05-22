import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreferences } from '@/hooks/use-preferences';
import { BoundingBoxOverlay } from './BoundingBoxOverlay';
import { CrossingBanner } from './CrossingBanner';
import { postCrossingDetect, type SignalState } from './crossing-api';
import { TransitBanner } from './TransitBanner';
import { postTransitDetect } from './transit-api';
import { useLiveDetection } from './use-live-detection';

// ─── Types ────────────────────────────────────────────────────────────────────

type DetectMode = 'obstacle' | 'transit';
type ViewSize = { width: number; height: number };

// Crossing signal detection is always ambient — no dedicated mode needed.
const MODES: { key: DetectMode; label: string }[] = [
  { key: 'obstacle', label: 'Obstacle' },
  { key: 'transit', label: 'Transit' },
];

const MAX_ERRORS_BEFORE_PAUSE = 3;

// ─── Mode tab bar ─────────────────────────────────────────────────────────────

function ModeSelector({
  mode,
  onChange,
}: {
  mode: DetectMode;
  onChange: (m: DetectMode) => void;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 110,
        left: 24,
        right: 24,
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.65)',
        borderRadius: 14,
        padding: 4,
      }}
    >
      {MODES.map((m) => (
        <Pressable
          key={m.key}
          onPress={() => onChange(m.key)}
          style={{
            flex: 1,
            paddingVertical: 8,
            borderRadius: 10,
            alignItems: 'center',
            backgroundColor: mode === m.key ? '#2563eb' : 'transparent',
          }}
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === m.key }}
          accessibilityLabel={`${m.label} mode`}
        >
          <Text
            style={{
              color: '#ffffff',
              fontWeight: mode === m.key ? '700' : '400',
              fontSize: 13,
            }}
          >
            {m.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DetectScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [active, setActive] = useState(false);
  const [mode, setMode] = useState<DetectMode>('obstacle');
  const [viewSize, setViewSize] = useState<ViewSize | null>(null);
  const { prefs } = usePreferences();

  // Per-mode scan counters for rate limiting (reset hourly)
  const crossingScansRef = useRef(0);
  const transitScansRef = useRef(0);

  useEffect(() => {
    const id = setInterval(
      () => {
        crossingScansRef.current = 0;
        transitScansRef.current = 0;
      },
      60 * 60 * 1000,
    );
    return () => clearInterval(id);
  }, []);

  // Crossing mode state
  const [signal, setSignal] = useState<SignalState>('none');
  const prevSignalRef = useRef<SignalState>('none');

  // Transit mode state
  const [busNumber, setBusNumber] = useState<string | null>(null);
  const [busDestination, setBusDestination] = useState<string | null>(null);
  const prevBusRef = useRef<string | null>(null);

  const captureImage = useCallback(async () => {
    if (!cameraRef.current || !cameraReady) return null;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.3,
        skipProcessing: true,
        exif: false,
      });
      if (!photo?.base64) return null;
      return {
        base64: photo.base64,
        width: photo.width ?? 1,
        height: photo.height ?? 1,
      };
    } catch {
      return null;
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
    enabled: active && cameraReady && mode === 'obstacle',
    captureImage,
  });

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
          Speech.speak(text, { language: 'en-AU', rate: 1.1 });
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
  ]);

  // ── Transit detection loop ───────────────────────────────────────────────────
  useEffect(() => {
    if (!active || !cameraReady || mode !== 'transit') return;

    const run = async () => {
      if (transitScansRef.current >= (prefs?.maxScansPerHour ?? 30)) return;
      transitScansRef.current += 1;
      const capture = await captureImage();
      if (!capture) return;
      try {
        const result = await postTransitDetect(capture.base64);
        setBusNumber(result.busNumber);
        setBusDestination(result.destination);

        // Announce only when bus number changes
        if (result.busNumber && result.busNumber !== prevBusRef.current) {
          const text = result.destination
            ? `Bus ${result.busNumber}, ${result.destination}`
            : `Bus ${result.busNumber} detected`;
          Speech.speak(text, { language: 'en-AU', rate: 1.0 });
          if (prefs?.hapticEnabled ?? true) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
        prevBusRef.current = result.busNumber;
      } catch {
        // silently ignore transit API errors
      }
    };

    void run();
    const id = setInterval(() => void run(), 3000);
    return () => {
      clearInterval(id);
      setBusNumber(null);
      setBusDestination(null);
      prevBusRef.current = null;
    };
  }, [
    active,
    cameraReady,
    mode,
    captureImage,
    prefs?.hapticEnabled,
    prefs?.maxScansPerHour,
  ]);

  // ── Reset detection state when mode changes ──────────────────────────────────
  const handleModeChange = useCallback((m: DetectMode) => {
    setMode(m);
    setActive(false);
    // Don't reset signal — crossing banner fades out naturally when detection stops
    setBusNumber(null);
    setBusDestination(null);
    transitScansRef.current = 0;
  }, []);

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

  const paused = mode === 'obstacle' && errorCount >= MAX_ERRORS_BEFORE_PAUSE;
  const running = mode === 'obstacle' ? isRunning : active;
  const showTransit = mode === 'transit';

  return (
    <View className="flex-1 bg-black">
      {/* Camera */}
      <CameraView
        ref={cameraRef}
        className="flex-1"
        facing="back"
        onCameraReady={() => setCameraReady(true)}
        onLayout={handleCameraLayout}
      />

      {/* Obstacle mode: bounding boxes */}
      {mode === 'obstacle' &&
      viewSize &&
      imageSize &&
      lastDetections.length > 0 ? (
        <BoundingBoxOverlay
          detections={lastDetections}
          imageSize={imageSize}
          viewSize={viewSize}
        />
      ) : null}

      {/* Obstacle mode: detection count badge */}
      {mode === 'obstacle' && lastDetections.length > 0 ? (
        <View className="absolute top-12 right-4 bg-primary rounded-full w-10 h-10 items-center justify-center">
          <Text className="text-white font-bold text-sm">
            {lastDetections.length}
          </Text>
        </View>
      ) : null}

      {/* Transit mode: yellow bus banner */}
      {showTransit ? (
        <TransitBanner busNumber={busNumber} destination={busDestination} />
      ) : null}

      {/* Crossing signal banner — always shown when active, any mode */}
      <CrossingBanner signal={signal} />

      {/* Mode selector */}
      <ModeSelector mode={mode} onChange={handleModeChange} />

      {/* Bottom controls */}
      <View className="absolute inset-x-0 bottom-0 pb-12 px-6 items-center gap-4">
        {/* Obstacle: description text */}
        {mode === 'obstacle' && lastDescription ? (
          <View className="bg-black/70 rounded-2xl px-4 py-3 max-w-sm">
            <Text className="text-white text-base text-center">
              {lastDescription}
            </Text>
          </View>
        ) : null}

        {/* Obstacle: paused error + retry */}
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
              {mode === 'transit'
                ? 'Point at a bus and tap Start to read the route number'
                : 'Tap Start — obstacles and crossing signals are detected automatically'}
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
