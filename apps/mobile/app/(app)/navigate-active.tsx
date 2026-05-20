import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ChevronRightIcon,
} from 'react-native-heroicons/outline';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BoundingBoxOverlay } from '@/features/detect/BoundingBoxOverlay';
import { CrossingBanner } from '@/features/detect/CrossingBanner';
import { TransitBanner } from '@/features/detect/TransitBanner';
import {
  postAssistantInteract,
  type AssistantInteractResponse,
} from '@/features/assistant/assistant-api';
import {
  postCrossingDetect,
  type SignalState,
} from '@/features/detect/crossing-api';
import type { DetectionResult } from '@/features/detect/detection-api';
import { postTransitDetect } from '@/features/detect/transit-api';
import { useLiveDetection } from '@/features/detect/use-live-detection';
import {
  useBatteryWarning,
  useGpsQuality,
  useHeading,
} from '@/features/navigate/nav-hooks';
import {
  DEVIATION_METERS,
  formatDuration,
  getTransitRoute,
  getWalkingRoute,
  haversineDistance,
  nearestPointOnRoute,
  type MapPoint,
  type Route,
  type RouteStep,
} from '@/features/navigate/routing-service';
import { usePreferences } from '@/hooks/use-preferences';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function TurnIcon({
  instruction,
  stepType,
  size = 28,
}: {
  instruction: string;
  stepType?: string;
  size?: number;
}) {
  const color = '#1e3a5f';
  if (stepType === 'transit') return <Text style={{ fontSize: size * 0.9 }}>🚌</Text>;
  const text = instruction.toLowerCase();
  if (text.includes('u-turn') || text.includes('uturn')) {
    return text.includes('left')
      ? <ArrowUturnLeftIcon size={size} color={color} />
      : <ArrowUturnRightIcon size={size} color={color} />;
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
  const currentMeters = liveDistToTurn ?? steps[fromStep]?.distanceMeters ?? 0;
  const futureMeters = steps.slice(fromStep + 1).reduce((s, st) => s + st.distanceMeters, 0);
  const meters = currentMeters + futureMeters;

  const currentSecs = steps[fromStep]?.durationSeconds ?? 0;
  const futureSecs = steps.slice(fromStep + 1).reduce((s, st) => s + st.durationSeconds, 0);
  const currentStepMeters = steps[fromStep]?.distanceMeters ?? 1;
  const ratio = liveDistToTurn != null ? Math.min(liveDistToTurn / currentStepMeters, 1) : 1;
  const seconds = Math.round(currentSecs * ratio) + futureSecs;

  const km = meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
  return { km, time: formatDuration(seconds) };
}

const ANNOUNCE_THRESHOLDS_M = [200, 50] as const;
const ADVANCE_THRESHOLD_M = 15;

const styles = StyleSheet.create({ screenRoot: { flex: 1, backgroundColor: '#000000' } });

function formatLiveDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  if (m >= 100) return `${Math.round(m / 10) * 10} m`;
  return `${Math.round(m / 5) * 5} m`;
}

function hasHighRiskObstacle(detections: DetectionResult[]): boolean {
  return detections.some((d) => d.proximity === 'very_near');
}

async function getBestEffortCurrentLocation(): Promise<Location.LocationObject> {
  const lastKnown = await Location.getLastKnownPositionAsync();
  if (lastKnown) return lastKnown;

  const highAccuracy = Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  const timed = Promise.race<Location.LocationObject>([
    highAccuracy,
    new Promise<Location.LocationObject>((_, reject) =>
      setTimeout(() => reject(new Error('Location timeout')), 8000),
    ),
  ]);

  try {
    return await timed;
  } catch {
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  }
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NavigateActiveScreen() {
  const {
    address,
    lat: latParam,
    lng: lngParam,
    mode: modeParam,
  } = useLocalSearchParams<{
    address?: string;
    lat?: string;
    lng?: string;
    mode?: string;
  }>();

  const isTransitMode = modeParam === 'transit';

  const destCoords = useMemo(
    () => ({
      lat: latParam ? Number.parseFloat(latParam) : Number.NaN,
      lng: lngParam ? Number.parseFloat(lngParam) : Number.NaN,
    }),
    [latParam, lngParam],
  );

  const hasValidDestination =
    Number.isFinite(destCoords.lat) &&
    Number.isFinite(destCoords.lng) &&
    Math.abs(destCoords.lat) <= 90 &&
    Math.abs(destCoords.lng) <= 180;

  const { prefs } = usePreferences();
  const speechRate = prefs?.speechRate ?? 1.0;
  const speechLang = prefs?.speechLanguage ?? 'en-AU';

  const speak = useCallback(
    (text: string) => {
      Speech.stop();
      Speech.speak(text, { rate: speechRate, language: speechLang });
    },
    [speechRate, speechLang],
  );

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const capturingRef = useRef(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [viewSize, setViewSize] = useState<{ width: number; height: number } | null>(null);

  // Route state
  const [route, setRoute] = useState<Route | null>(null);
  const [routeLoading, setRouteLoading] = useState(true);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [distToNextTurn, setDistToNextTurn] = useState<number | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const announcedThresholdsRef = useRef(new Set<number>());
  const recalcRef = useRef(false);

  // GPS
  const [userLocation, setUserLocation] = useState<MapPoint | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  // Crossing detection
  const [signal, setSignal] = useState<SignalState>('none');
  const prevSignalRef = useRef<SignalState>('none');
  const crossingScansRef = useRef(0);
  const transitScansRef = useRef(0);
  const [busNumber, setBusNumber] = useState<string | null>(null);
  const [busDestination, setBusDestination] = useState<string | null>(null);
  const prevBusRef = useRef<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const assistantSpeakingRef = useRef(false);

  // Reset scan counters hourly
  useEffect(() => {
    const id = setInterval(() => {
      crossingScansRef.current = 0;
      transitScansRef.current = 0;
    }, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Accessibility hooks from old app
  const lowBattery = useBatteryWarning(!arrived && !routeLoading, speechRate, speechLang);
  const lowGps = useGpsQuality(gpsAccuracy, !routeLoading && !arrived, speechRate);
  const headingLabel = useHeading(!routeLoading && !arrived);

  // ── Announce step whenever activeStep changes ────────────────────────────────
  useEffect(() => {
    if (!route || arrived) return;
    const step = route.steps[activeStep];
    if (!step) return;
    const text = stripHtml(step.instruction);
    const td = step.transitDetails;
    const extra =
      step.stepType === 'transit' && td?.departureStop
        ? `. Board at ${td.departureStop}`
        : '';
    speak(`${text}${extra}`);
  }, [route, activeStep, arrived, speak]);

  // ── Route fetch ──────────────────────────────────────────────────────────────
  const fetchRoute = useCallback(
    async (origin: { lat: number; lng: number }) => {
      const fn = isTransitMode ? getTransitRoute : getWalkingRoute;
      return fn(origin, destCoords);
    },
    [isTransitMode, destCoords],
  );

  useEffect(() => {
    if (!address) { setRouteLoading(false); return; }
    if (!hasValidDestination) {
      setRouteLoading(false);
      setRouteError('Destination coordinates are invalid. Please re-select from Home.');
      return;
    }
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setRouteLoading(false);
        setRouteError('Location access is required for navigation. Please enable it in Settings.');
        return;
      }

      try {
        const loc = await getBestEffortCurrentLocation();
        const origin = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        setGpsAccuracy(loc.coords.accuracy);
        const r = await fetchRoute(origin);
        setRoute(r);

        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 5 },
          (loc) => {
            setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            setGpsAccuracy(loc.coords.accuracy);
          },
        );
      } catch { setRouteError('Could not load route. Check your connection.'); }
      finally { setRouteLoading(false); }
    })();

    return () => { sub?.remove(); };
  }, [address, destCoords, hasValidDestination, fetchRoute]);

  // ── Route deviation detection + recalculation ────────────────────────────────
  useEffect(() => {
    // Skip recalculation if currently on a transit leg — GPS deviation is expected on buses/trains
    const currentStep = route?.steps[activeStep];
    if (!route || !userLocation || arrived || recalcRef.current || currentStep?.stepType === 'transit') return;
    if (route.polylinePoints.length < 2) return;

    const distFromRoute = nearestPointOnRoute(userLocation, route.polylinePoints);
    if (distFromRoute <= DEVIATION_METERS) return;

    recalcRef.current = true;
    setIsRecalculating(true);
    speak('Recalculating route.');

    void (async () => {
      try {
        const origin = { lat: userLocation.latitude, lng: userLocation.longitude };
        const r = await fetchRoute(origin);
        setRoute(r);
        setActiveStep(0);
        announcedThresholdsRef.current = new Set();
        setDistToNextTurn(null);
      } catch {
        speak('Unable to recalculate. Continuing on current route.');
      } finally {
        recalcRef.current = false;
        setIsRecalculating(false);
      }
    })();
  }, [userLocation, route, activeStep, arrived, fetchRoute, speak]);

  // ── GPS step advancement — walking steps only ────────────────────────────────
  useEffect(() => {
    if (!route || !userLocation || arrived || recalcRef.current) return;
    const step = route.steps[activeStep];
    if (!step?.endCoord || step.stepType === 'transit') return;

    const dist = haversineDistance(userLocation, step.endCoord);
    setDistToNextTurn(dist);

    for (const threshold of ANNOUNCE_THRESHOLDS_M) {
      if (dist <= threshold && !announcedThresholdsRef.current.has(threshold)) {
        announcedThresholdsRef.current.add(threshold);
        speak(`In ${threshold} metres, ${stripHtml(step.instruction).toLowerCase()}`);
      }
    }

    if (dist < ADVANCE_THRESHOLD_M) {
      advanceStep(route, activeStep);
    }
  }, [userLocation, route, activeStep, arrived, speak]);

  function advanceStep(r: Route, fromIndex: number) {
    const nextIndex = fromIndex + 1;
    announcedThresholdsRef.current = new Set();
    setDistToNextTurn(null);

    if (nextIndex >= r.steps.length) {
      setArrived(true);
      speak('You have arrived at your destination.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setActiveStep(nextIndex);
      speak(stripHtml(r.steps[nextIndex].instruction));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  // Manual "Next step" for transit legs
  const handleNextStep = useCallback(() => {
    if (!route || arrived) return;
    advanceStep(route, activeStep);
  }, [route, activeStep, arrived]);

  // ── Obstacle detection ───────────────────────────────────────────────────────
  const captureImage = useCallback(async () => {
    if (!cameraRef.current || !cameraReady || capturingRef.current) return null;
    capturingRef.current = true;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true, quality: 0.3, skipProcessing: true, shutterSound: false, exif: false,
      });
      if (!photo?.base64) return null;
      return { base64: photo.base64, uri: photo.uri, width: photo.width ?? 1, height: photo.height ?? 1 };
    } catch { return null; }
    finally { capturingRef.current = false; }
  }, [cameraReady]);

  const { lastDetections, imageSize } = useLiveDetection({
    intervalSec: prefs?.detectionIntervalSec ?? 10,
    maxScansPerHour: prefs?.maxScansPerHour ?? 30,
    hapticEnabled: prefs?.hapticEnabled ?? true,
    enabled: cameraReady && !arrived,
    speechRate,
    speechLanguage: speechLang,
    captureImage,
  });

  useEffect(() => {
    if (!assistantSpeakingRef.current) return;
    if (!hasHighRiskObstacle(lastDetections)) return;
    Speech.stop();
    assistantSpeakingRef.current = false;
    const primary = lastDetections.find((d) => d.proximity === 'very_near');
    if (primary) {
      speak(`Warning. Very close ${primary.name}.`);
    }
  }, [lastDetections, speak]);

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
          speak(text);
          if (prefs?.hapticEnabled ?? true) {
            result.signal === 'walk'
              ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        }
        prevSignalRef.current = result.signal;
      } catch { /* ignore */ }
    };

    void run();
    const id = setInterval(() => void run(), 2000);
    return () => {
      clearInterval(id);
      setSignal('none');
      prevSignalRef.current = 'none';
    };
  }, [cameraReady, arrived, captureImage, prefs?.hapticEnabled, prefs?.maxScansPerHour, speak]);

  // ── Transit detection (only while navigating in transit mode) ───────────────
  useEffect(() => {
    if (!isTransitMode || !cameraReady || arrived) return;

    const runTransit = async () => {
      if (transitScansRef.current >= (prefs?.maxScansPerHour ?? 30)) return;
      transitScansRef.current += 1;
      const capture = await captureImage();
      if (!capture) return;
      try {
        const result = await postTransitDetect(capture.base64);
        setBusNumber(result.busNumber);
        setBusDestination(result.destination);
        if (result.busNumber && result.busNumber !== prevBusRef.current) {
          const text = result.destination
            ? `Bus ${result.busNumber}, ${result.destination}`
            : `Bus ${result.busNumber} detected`;
          speak(text);
          if (prefs?.hapticEnabled ?? true) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
        prevBusRef.current = result.busNumber;
      } catch {
        // keep navigation running even if transit detection is unavailable
      }
    };

    void runTransit();
    const id = setInterval(() => void runTransit(), 3000);
    return () => {
      clearInterval(id);
      setBusNumber(null);
      setBusDestination(null);
      prevBusRef.current = null;
    };
  }, [
    isTransitMode,
    cameraReady,
    arrived,
    captureImage,
    prefs?.hapticEnabled,
    prefs?.maxScansPerHour,
    speak,
  ]);

  const startVoiceCapture = useCallback(async () => {
    if (assistantBusy || recording) return;
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) {
      speak('Microphone permission is required.');
      return;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await rec.startAsync();
    setRecording(rec);
  }, [assistantBusy, recording, speak]);

  const stopVoiceCapture = useCallback(async () => {
    if (!recording || assistantBusy) return;
    setAssistantBusy(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) throw new Error('Could not read recording file');

      const audioBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const result = await postAssistantInteract({
        audioBase64,
        mimeType: 'audio/mp4',
        mode: isTransitMode ? 'transit' : 'walking',
        lastDetections: lastDetections.slice(0, 5).map((d) => d.name),
        activeRouteStep: route?.steps[activeStep]?.instruction,
      });
      if (!hasHighRiskObstacle(lastDetections) && result.replyText) {
        assistantSpeakingRef.current = true;
        Speech.speak(result.replyText, {
          rate: speechRate,
          language: speechLang,
          onDone: () => {
            assistantSpeakingRef.current = false;
          },
          onStopped: () => {
            assistantSpeakingRef.current = false;
          },
          onError: () => {
            assistantSpeakingRef.current = false;
          },
        });
      }
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Voice interaction failed';
      speak(`Voice interaction failed. ${msg}`);
    } finally {
      setAssistantBusy(false);
    }
  }, [
    recording,
    assistantBusy,
    isTransitMode,
    lastDetections,
    route,
    activeStep,
    speechRate,
    speechLang,
    speak,
  ]);

  const handleEnd = () => { Speech.stop(); router.back(); };

  const handleCameraLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setViewSize({ width, height });
  }, []);

  // ── Permission gate ──────────────────────────────────────────────────────────
  if (!permission) {
    return <View className="flex-1 items-center justify-center bg-black"><ActivityIndicator color="white" /></View>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-900 p-6">
        <Text className="text-white text-xl font-semibold mb-4 text-center">Camera access required</Text>
        <Pressable onPress={requestPermission} className="bg-primary px-8 py-4 rounded-2xl" accessibilityRole="button">
          <Text className="text-white font-semibold text-lg">Grant access</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const currentStep: RouteStep | undefined = route?.steps[activeStep];
  const isCurrentStepTransit = currentStep?.stepType === 'transit';
  const stats = route ? remainingStats(route.steps, activeStep, distToNextTurn) : null;
  const liveDistLabel =
    distToNextTurn != null && !isCurrentStepTransit
      ? formatLiveDistance(distToNextTurn)
      : (currentStep?.duration ?? '');

  const accentColor = isTransitMode ? '#16a34a' : '#2563eb';
  const accentBg = isTransitMode ? '#f0fdf4' : '#eff6ff';

  return (
    <View style={styles.screenRoot}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
        onLayout={handleCameraLayout}
      />

      {viewSize && imageSize && lastDetections.length > 0 ? (
        <BoundingBoxOverlay detections={lastDetections} imageSize={imageSize} viewSize={viewSize} />
      ) : null}
      {isTransitMode ? (
        <TransitBanner busNumber={busNumber} destination={busDestination} />
      ) : null}

      {/* ── Turn card (top) ───────────────────────────────────────────────── */}
      <SafeAreaView
        edges={['top']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none' }}
      >
        <View
          style={{
            marginHorizontal: 16, marginTop: 12,
            backgroundColor: '#ffffff', borderRadius: 20, padding: 16,
            flexDirection: 'row', alignItems: 'center', gap: 14,
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18, shadowRadius: 8, elevation: 6,
          }}
        >
          {routeLoading || isRecalculating ? (
            <>
              <ActivityIndicator color={accentColor} size="small" />
              <Text style={{ color: '#6b7280', fontSize: 14 }}>
                {isRecalculating ? 'Recalculating…' : 'Getting your location…'}
              </Text>
            </>
          ) : routeError ? (
            <Text style={{ color: '#ef4444', fontSize: 14, flex: 1 }}>{routeError}</Text>
          ) : arrived ? (
            <>
              <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24 }}>✓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: '#166534' }}>Arrived</Text>
                <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>{address ?? 'Destination'}</Text>
              </View>
            </>
          ) : currentStep ? (
            <>
              <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: accentBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TurnIcon instruction={currentStep.instruction} stepType={currentStep.stepType} size={28} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 26, fontWeight: '800', color: '#111827' }}>{liveDistLabel}</Text>
                <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }} numberOfLines={2}>
                  {stripHtml(currentStep.instruction)}
                </Text>
                {isCurrentStepTransit && currentStep.transitDetails?.departureStop ? (
                  <Text style={{ fontSize: 12, color: '#16a34a', marginTop: 2, fontWeight: '600' }}>
                    Board at {currentStep.transitDetails.departureStop}
                    {currentStep.transitDetails.departureTime ? ` · ${currentStep.transitDetails.departureTime}` : ''}
                  </Text>
                ) : null}
                {headingLabel ? (
                  <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{headingLabel}</Text>
                ) : null}
              </View>
            </>
          ) : (
            <Text style={{ color: '#6b7280' }}>Calculating route…</Text>
          )}
        </View>

        {/* Status banners */}
        {lowBattery ? (
          <View style={{ marginHorizontal: 16, marginTop: 6, backgroundColor: '#fef3c7', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: '#92400e', fontSize: 13, textAlign: 'center' }}>⚠ Battery low — camera scans may be limited</Text>
          </View>
        ) : null}
        {lowGps ? (
          <View style={{ marginHorizontal: 16, marginTop: 6, backgroundColor: '#fef3c7', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: '#92400e', fontSize: 13, textAlign: 'center' }}>⚠ GPS accuracy low</Text>
          </View>
        ) : null}
      </SafeAreaView>

      {/* Crossing signal banner */}
      <CrossingBanner signal={signal} />

      {/* ── ETA bar + controls (bottom) ───────────────────────────────────── */}
      <View
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: 'rgba(17,24,39,0.92)',
          paddingHorizontal: 24, paddingTop: 16, paddingBottom: 36, gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#ffffff' }}>{stats?.time ?? '—'}</Text>
            <Text style={{ fontSize: 14, color: '#9ca3af', marginTop: 2 }}>{stats?.km ?? '—'} to arrive</Text>
          </View>
          <Pressable
            onPress={handleEnd}
            style={{ backgroundColor: '#ef4444', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 50 }}
            accessibilityRole="button"
            accessibilityLabel="End navigation"
          >
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>End</Text>
          </Pressable>
        </View>

        {/* Next Step button — shown for transit legs only */}
        {isCurrentStepTransit && !arrived && route ? (
          <Pressable
            onPress={handleNextStep}
            style={{ backgroundColor: accentColor, paddingVertical: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Mark this step done and advance to next step"
          >
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>
              {activeStep + 1 >= (route?.steps.length ?? 0) ? 'Arrived' : 'Next Step'}
            </Text>
            <ChevronRightIcon size={20} color="#ffffff" />
          </Pressable>
        ) : null}

        <Pressable
          onPressIn={() => void startVoiceCapture()}
          onPressOut={() => void stopVoiceCapture()}
          disabled={assistantBusy}
          style={{
            backgroundColor: assistantBusy ? '#64748b' : '#0ea5e9',
            paddingVertical: 12,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="Hold to talk with assistant"
        >
          <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>
            {assistantBusy
              ? 'Processing voice…'
              : recording
                ? 'Listening… release to send'
                : 'Hold to Talk'}
          </Text>
        </Pressable>

      </View>
    </View>
  );
}
