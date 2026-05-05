import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from 'react-native-heroicons/outline';
import { usePreferences } from '@/hooks/use-preferences';
import { BoundingBoxOverlay } from '@/features/detect/BoundingBoxOverlay';
import { CrossingBanner } from '@/features/detect/CrossingBanner';
import { postCrossingDetect, type SignalState } from '@/features/detect/crossing-api';
import { useLiveDetection } from '@/features/detect/use-live-detection';
import {
  getWalkingRoute,
  haversineDistance,
  formatDuration,
  type MapPoint,
  type Route,
  type RouteStep,
} from '@/features/navigate/routing-service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function TurnIcon({ instruction, size = 28 }: { instruction: string; size?: number }) {
  const text = instruction.toLowerCase();
  const color = '#1e3a5f';
  if (text.includes('u-turn') || text.includes('uturn')) {
    return text.includes('left') ? (
      <ArrowUturnLeftIcon size={size} color={color} />
    ) : (
      <ArrowUturnRightIcon size={size} color={color} />
    );
  }
  if (text.includes('right')) return <ArrowRightIcon size={size} color={color} />;
  if (text.includes('left')) return <ArrowLeftIcon size={size} color={color} />;
  return <ArrowUpIcon size={size} color={color} />;
}


function remainingStats(
  steps: RouteStep[],
  fromStep: number,
  liveDistToTurn: number | null,
) {
  // Use live GPS distance for current step; fall back to static for future steps
  const currentMeters = liveDistToTurn ?? steps[fromStep]?.distanceMeters ?? 0;
  const futureMeters = steps.slice(fromStep + 1).reduce((s, step) => s + step.distanceMeters, 0);
  const meters = currentMeters + futureMeters;

  const currentSecs = steps[fromStep]?.durationSeconds ?? 0;
  const futureSecs = steps.slice(fromStep + 1).reduce((s, step) => s + step.durationSeconds, 0);
  // Scale current step duration by how far through the step we are
  const currentStepMeters = steps[fromStep]?.distanceMeters ?? 1;
  const ratio = liveDistToTurn != null ? Math.min(liveDistToTurn / currentStepMeters, 1) : 1;
  const seconds = Math.round(currentSecs * ratio) + futureSecs;

  const km = meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`;
  return { km, time: formatDuration(seconds) };
}

// Distance thresholds (metres) at which to pre-announce the upcoming turn.
// Each threshold fires exactly once per step, then resets when the step advances.
const ANNOUNCE_THRESHOLDS_M = [200, 50] as const;
const ADVANCE_THRESHOLD_M = 15;

function formatLiveDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  if (m >= 100) return `${Math.round(m / 10) * 10} m`;
  return `${Math.round(m / 5) * 5} m`;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NavigateActiveScreen() {
  const { address, lat: latParam, lng: lngParam } = useLocalSearchParams<{
    address?: string;
    lat?: string;
    lng?: string;
  }>();

  const destCoords = {
    lat: latParam ? Number.parseFloat(latParam) : 0,
    lng: lngParam ? Number.parseFloat(lngParam) : 0,
  };

  const { prefs } = usePreferences();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [viewSize, setViewSize] = useState<{ width: number; height: number } | null>(null);

  // Route state
  const [route, setRoute] = useState<Route | null>(null);
  const [routeLoading, setRouteLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [distToNextTurn, setDistToNextTurn] = useState<number | null>(null);
  // Tracks which distance thresholds have already been announced for the current step
  const announcedThresholdsRef = useRef(new Set<number>());

  // GPS
  const [userLocation, setUserLocation] = useState<MapPoint | null>(null);

  // Crossing detection
  const [signal, setSignal] = useState<SignalState>('none');
  const prevSignalRef = useRef<SignalState>('none');
  const crossingScansRef = useRef(0);

  // ── Announce current step whenever route loads/updates ──────────────────────
  // Fires on initial load and again when GPS re-fetches a more accurate route.
  useEffect(() => {
    if (!route || arrived) return;
    const step = route.steps[activeStep];
    if (step) {
      Speech.stop();
      Speech.speak(stripHtml(step.instruction), { language: 'en-AU', rate: 1.0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  // ── Initial route fetch with placeholder origin (GPS not yet known) ──────────
  useEffect(() => {
    if (!address) return;
    setRouteLoading(true);
    getWalkingRoute({ lat: 0, lng: 0 }, destCoords)
      .then((r) => setRoute(r))
      .catch(() => {})
      .finally(() => setRouteLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── GPS tracking + step advancement ─────────────────────────────────────────
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // Re-fetch route from actual origin once we have GPS
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        .then((loc) => {
          const origin = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          setRouteLoading(true);
          return getWalkingRoute(origin, destCoords);
        })
        .then((r) => setRoute(r))
        .catch(() => {})
        .finally(() => setRouteLoading(false));

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        (loc) => {
          const pos: MapPoint = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setUserLocation(pos);
        },
      );
    })();

    return () => { sub?.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live GPS tracking: update distance to next turn, fire threshold announcements, advance step
  useEffect(() => {
    if (!route || !userLocation || arrived) return;
    const step = route.steps[activeStep];
    if (!step?.endCoord) return;

    const dist = haversineDistance(userLocation, step.endCoord);
    setDistToNextTurn(dist);

    // Waze-style: announce at each distance threshold exactly once per step
    for (const threshold of ANNOUNCE_THRESHOLDS_M) {
      if (dist <= threshold && !announcedThresholdsRef.current.has(threshold)) {
        announcedThresholdsRef.current.add(threshold);
        const distText = `${threshold} metres`;
        Speech.stop();
        Speech.speak(
          `In ${distText}, ${stripHtml(step.instruction).toLowerCase()}`,
          { language: 'en-AU', rate: 1.0 },
        );
      }
    }

    // Advance step when close enough to turn point
    if (dist < ADVANCE_THRESHOLD_M) {
      const nextIndex = activeStep + 1;
      announcedThresholdsRef.current = new Set(); // reset thresholds for next step
      setDistToNextTurn(null);

      if (nextIndex >= route.steps.length) {
        setArrived(true);
        Speech.stop();
        Speech.speak('You have arrived at your destination.', { language: 'en-AU', rate: 1.0 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setActiveStep(nextIndex);
        Speech.stop();
        Speech.speak(stripHtml(route.steps[nextIndex].instruction), {
          language: 'en-AU',
          rate: 1.0,
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [userLocation, route, activeStep, arrived]);

  // ── Obstacle detection ───────────────────────────────────────────────────────
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
      return { base64: photo.base64, width: photo.width ?? 1, height: photo.height ?? 1 };
    } catch {
      return null;
    }
  }, [cameraReady]);

  const { lastDetections, imageSize } = useLiveDetection({
    intervalSec: prefs?.detectionIntervalSec ?? 10,
    maxScansPerHour: prefs?.maxScansPerHour ?? 30,
    hapticEnabled: prefs?.hapticEnabled ?? true,
    enabled: cameraReady && !arrived,
    captureImage,
  });

  // ── Crossing detection ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!cameraReady || arrived) return;

    const run = async () => {
      if (crossingScansRef.current >= (prefs?.maxScansPerHour ?? 30)) return;
      crossingScansRef.current += 1;
      const capture = await captureImage();
      if (!capture) return;
      try {
        const result = await postCrossingDetect(capture.base64);
        setSignal(result.signal);
        if (result.signal !== 'none' && result.signal !== prevSignalRef.current) {
          const text = result.signal === 'walk' ? 'Walk signal' : "Don't walk signal, wait";
          Speech.stop();
          Speech.speak(text, { language: 'en-AU', rate: 1.1 });
          if (prefs?.hapticEnabled ?? true) {
            result.signal === 'walk'
              ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        }
        prevSignalRef.current = result.signal;
      } catch {
        // ignore
      }
    };

    void run();
    const id = setInterval(() => void run(), 2000);
    return () => {
      clearInterval(id);
      setSignal('none');
      prevSignalRef.current = 'none';
    };
  }, [cameraReady, arrived, captureImage, prefs?.hapticEnabled, prefs?.maxScansPerHour]);

  const handleEnd = () => {
    Speech.stop();
    router.back();
  };

  const handleCameraLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setViewSize({ width, height });
  }, []);

  // ── Permission gate ──────────────────────────────────────────────────────────
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
        <Pressable
          onPress={requestPermission}
          className="bg-primary px-8 py-4 rounded-2xl"
          accessibilityRole="button"
        >
          <Text className="text-white font-semibold text-lg">Grant access</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const currentStep: RouteStep | undefined = route?.steps[activeStep];
  const stats = route ? remainingStats(route.steps, activeStep, distToNextTurn) : null;
  const liveDistLabel = distToNextTurn != null
    ? formatLiveDistance(distToNextTurn)
    : currentStep?.distance ?? '';

  return (
    <View className="flex-1 bg-black">
      {/* Full-screen camera */}
      <CameraView
        ref={cameraRef}
        className="flex-1"
        facing="back"
        onCameraReady={() => setCameraReady(true)}
        onLayout={handleCameraLayout}
      />

      {/* Obstacle bounding boxes */}
      {viewSize && imageSize && lastDetections.length > 0 ? (
        <BoundingBoxOverlay
          detections={lastDetections}
          imageSize={imageSize}
          viewSize={viewSize}
        />
      ) : null}

      {/* ── Turn card (top) ───────────────────────────────────────────────── */}
      <SafeAreaView
        edges={['top']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none' }}
      >
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            backgroundColor: '#ffffff',
            borderRadius: 20,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          {routeLoading ? (
            <ActivityIndicator color="#2563eb" size="small" />
          ) : arrived ? (
            <>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#22c55e',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 24 }}>✓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: '#166534' }}>
                  Arrived
                </Text>
                <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
                  {address ?? 'Destination'}
                </Text>
              </View>
            </>
          ) : currentStep ? (
            <>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: '#eff6ff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <TurnIcon instruction={currentStep.instruction} size={28} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 26, fontWeight: '800', color: '#111827' }}>
                  {liveDistLabel}
                </Text>
                <Text
                  style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}
                  numberOfLines={2}
                >
                  {stripHtml(currentStep.instruction)}
                </Text>
              </View>
            </>
          ) : (
            <Text style={{ color: '#6b7280' }}>Calculating route…</Text>
          )}
        </View>
      </SafeAreaView>

      {/* Crossing signal banner — rendered last so it overlays the turn card */}
      <CrossingBanner signal={signal} />

      {/* ── ETA bar (bottom) ──────────────────────────────────────────────── */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(17,24,39,0.92)',
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 36,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#ffffff' }}>
            {stats?.time ?? '—'}
          </Text>
          <Text style={{ fontSize: 14, color: '#9ca3af', marginTop: 2 }}>
            {stats?.km ?? '—'} to arrive
          </Text>
        </View>
        <Pressable
          onPress={handleEnd}
          style={{
            backgroundColor: '#ef4444',
            paddingHorizontal: 28,
            paddingVertical: 14,
            borderRadius: 50,
          }}
          accessibilityRole="button"
          accessibilityLabel="End navigation"
        >
          <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>End</Text>
        </Pressable>
      </View>
    </View>
  );
}
