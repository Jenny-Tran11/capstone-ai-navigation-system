import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import {
  ArrowsRightLeftIcon,
  ClockIcon,
  MapPinIcon,
  SpeakerWaveIcon,
  TruckIcon,
  UserIcon,
} from 'react-native-heroicons/outline';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getTransitRoute,
  getWalkingRoute,
  type MapPoint,
  type Route,
  type RouteStep,
  type StepType,
} from './routing-service';
import { usePreferences } from '@/hooks/use-preferences';
import { getRuntimeConfig } from '@/lib/runtime-config';

type TravelMode = 'walking' | 'transit';

const TRAVEL_MODES: { key: TravelMode; label: string; Icon: typeof UserIcon }[] = [
  { key: 'walking', label: 'Walk', Icon: UserIcon },
  { key: 'transit', label: 'Transit', Icon: TruckIcon },
];

function ModeToggle({
  mode,
  onChange,
}: {
  mode: TravelMode;
  onChange: (m: TravelMode) => void;
}) {
  return (
    <View className="flex-row mx-5 mb-3 bg-slate-100 rounded-2xl p-1">
      {TRAVEL_MODES.map(({ key, label, Icon }) => (
        <Pressable
          key={key}
          onPress={() => onChange(key)}
          className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl ${
            mode === key ? 'bg-white shadow-sm' : ''
          }`}
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === key }}
          accessibilityLabel={`${label} mode`}
        >
          <Icon size={18} color={mode === key ? '#2563eb' : '#64748b'} />
          <Text
            className={`text-sm font-semibold ${
              mode === key ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function stepIcon(stepType?: StepType): string {
  return stepType === 'transit' ? '🚌' : '🚶';
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

export default function NavigatePlanScreen() {
  const {
    address,
    lat: latParam,
    lng: lngParam,
    latitude: latitudeParam,
    longitude: longitudeParam,
  } = useLocalSearchParams<{
    address?: string;
    lat?: string;
    lng?: string;
    latitude?: string;
    longitude?: string;
  }>();

  const destCoords = useMemo(() => {
    const latRaw = latParam ?? latitudeParam ?? '';
    const lngRaw = lngParam ?? longitudeParam ?? '';
    return {
      lat: latRaw ? Number.parseFloat(latRaw) : Number.NaN,
      lng: lngRaw ? Number.parseFloat(lngRaw) : Number.NaN,
    };
  }, [latParam, lngParam, latitudeParam, longitudeParam]);

  const hasValidDestination =
    Number.isFinite(destCoords.lat) &&
    Number.isFinite(destCoords.lng) &&
    Math.abs(destCoords.lat) <= 90 &&
    Math.abs(destCoords.lng) <= 180;

  const [travelMode, setTravelMode] = useState<TravelMode>('walking');
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [userLocation, setUserLocation] = useState<MapPoint | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [routeRefreshTick, setRouteRefreshTick] = useState(0);
  const [debugMapsKeySet, setDebugMapsKeySet] = useState<'yes' | 'no' | 'unknown'>('unknown');
  const mapRef = useRef<MapView>(null);
  const { prefs } = usePreferences();

  // Re-fetch route whenever travel mode changes
  useEffect(() => {
    void (async () => {
      try {
        const cfg = await getRuntimeConfig();
        setDebugMapsKeySet(cfg.googleMapsApiKey ? 'yes' : 'no');
      } catch {
        setDebugMapsKeySet('unknown');
      }
    })();
  }, []);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }
    if (!hasValidDestination) {
      setLoading(false);
      setError('Destination coordinates are invalid. Please re-select address from Home.');
      return;
    }

    setLoading(true);
    setError(null);
    setRoute(null);
    setActiveStep(0);

    let sub: Location.LocationSubscription | null = null;

    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationDenied(true);
        try {
          const fetchRoute =
            travelMode === 'transit' ? getTransitRoute : getWalkingRoute;
          const fallbackOrigin = {
            lat: destCoords.lat - 0.002,
            lng: destCoords.lng - 0.002,
          };
          const r = await fetchRoute(fallbackOrigin, destCoords);
          setRoute(r);
        } catch (err) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Could not find a route. Check your connection.';
          setError(msg);
        } finally {
          setLoading(false);
        }
        return;
      }

      setLocationDenied(false);

      try {
        const loc = await getBestEffortCurrentLocation();
        const origin = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        const fetchRoute =
          travelMode === 'transit' ? getTransitRoute : getWalkingRoute;
        const r = await fetchRoute(origin, destCoords);
        setRoute(r);

        if (r.polylinePoints.length > 0) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(r.polylinePoints, {
              edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
              animated: true,
            });
          }, 500);
        }
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Could not find a route. Check your connection.';
        setError(msg);
      } finally {
        setLoading(false);
      }

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        (loc) => {
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        },
      );
    })();

    return () => {
      sub?.remove();
    };
  }, [address, destCoords, hasValidDestination, travelMode, routeRefreshTick]);

  const speakStep = (step: RouteStep) => {
    Speech.speak(step.instruction, { language: 'en-AU', rate: 1.0 });
  };

  const destPoint: MapPoint = {
    latitude: destCoords.lat || -33.8703,
    longitude: destCoords.lng || 151.2117,
  };

  const mapCenter = route?.polylinePoints?.[0] ?? userLocation ?? destPoint;
  const polylineColor = travelMode === 'transit' ? '#16a34a' : '#2563eb';

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-4 pb-3 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Navigate</Text>
        {address ? (
          <Text className="text-gray-500 mt-1" numberOfLines={1}>
            To: {address}
          </Text>
        ) : null}
      </View>

      {/* Travel mode toggle */}
      <View className="pt-3">
        <ModeToggle mode={travelMode} onChange={setTravelMode} />
      </View>

      {/* Navigation debug widget */}
      {prefs?.debugMode ? (
      <View className="mx-5 mb-2 bg-black/80 rounded-xl px-3 py-2">
        <Text className="text-white text-xs font-semibold">
          Nav Debug
        </Text>
        <Text className="text-white text-xs">
          mode={travelMode} | loading={loading ? 'yes' : 'no'} | locDenied={locationDenied ? 'yes' : 'no'}
        </Text>
        <Text className="text-white text-xs">
          mapsKey={debugMapsKeySet} | route={route ? 'yes' : 'no'} | steps={route?.steps.length ?? 0} | points={route?.polylinePoints.length ?? 0}
        </Text>
        <Text className="text-white text-xs" numberOfLines={1}>
          dest=({Number.isFinite(destCoords.lat) ? destCoords.lat.toFixed(5) : 'NaN'}, {Number.isFinite(destCoords.lng) ? destCoords.lng.toFixed(5) : 'NaN'})
        </Text>
        <Text className="text-red-300 text-xs" numberOfLines={2}>
          err={error ?? 'none'}
        </Text>
        <Pressable
          onPress={() => setRouteRefreshTick((v) => v + 1)}
          className="self-start mt-2 bg-emerald-600 rounded-lg px-3 py-2"
          accessibilityRole="button"
          accessibilityLabel="Refresh route"
        >
          <Text className="text-white text-xs font-bold">REFRESH ROUTE</Text>
        </Pressable>
      </View>
      ) : null}

      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-3">
            {travelMode === 'transit'
              ? 'Finding transit options…'
              : 'Getting your location…'}
          </Text>
        </View>
      )}

      {locationDenied ? (
        <View className="px-5 py-2 bg-yellow-50 border-b border-yellow-100">
          <Text className="text-yellow-800 text-sm text-center">
            Location access denied — directions shown from destination area
          </Text>
        </View>
      ) : null}

      {error && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-base text-center">{error}</Text>
        </View>
      )}

      {!loading && route && (
        <View className="flex-1">
          {/* Map — top 40% of screen */}
          <View style={{ height: '40%' }}>
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: mapCenter.latitude,
                longitude: mapCenter.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation={false}
              showsMyLocationButton={false}
            >
              {route.polylinePoints.length > 0 ? (
                <Polyline
                  coordinates={route.polylinePoints}
                  strokeColor={polylineColor}
                  strokeWidth={4}
                />
              ) : null}

              <Marker
                coordinate={destPoint}
                title={address ?? 'Destination'}
                pinColor="#ef4444"
              />

              {userLocation ? (
                <Marker
                  coordinate={userLocation}
                  title="You are here"
                  pinColor="#2563eb"
                />
              ) : null}
            </MapView>
          </View>

          {/* Route summary strip */}
          <View className="px-5 py-3 bg-blue-50 flex-row gap-4 items-center border-b border-blue-100">
            <View className="flex-row items-center gap-1.5">
              <ArrowsRightLeftIcon size={16} color="#475569" />
              <Text className="text-sm text-gray-600">
                {route.totalDistance}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <ClockIcon size={16} color="#475569" />
              <Text className="text-sm text-gray-600">
                {route.totalDuration}
              </Text>
            </View>
            {travelMode === 'transit' ? (
              <Text className="text-sm text-green-700 font-medium ml-auto">
                Public transport
              </Text>
            ) : null}
          </View>

          {/* Step list */}
          <FlatList
            data={route.steps}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => {
                  setActiveStep(index);
                  speakStep(item);
                }}
                className={`rounded-2xl p-4 flex-row items-start gap-3 ${
                  activeStep === index
                    ? 'bg-blue-50 border border-primary'
                    : 'bg-gray-50'
                }`}
                accessibilityRole="button"
                accessibilityLabel={`Step ${index + 1}: ${item.instruction}`}
              >
                <View
                  className={`w-7 h-7 rounded-full items-center justify-center shrink-0 mt-0.5 ${
                    item.stepType === 'transit' ? 'bg-green-600' : 'bg-primary'
                  }`}
                >
                  <Text className="text-white text-xs font-bold">
                    {index + 1}
                  </Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-base">{stepIcon(item.stepType)}</Text>
                    <Text className="text-base text-gray-900 flex-1">
                      {item.instruction}
                    </Text>
                  </View>
                  {item.transitDetails?.departureTime ? (
                    <Text className="text-xs text-green-700 mt-0.5">
                      Depart {item.transitDetails.departureTime}
                      {item.transitDetails.arrivalTime
                        ? ` → Arrive ${item.transitDetails.arrivalTime}`
                        : ''}
                    </Text>
                  ) : null}
                  <Text className="text-sm text-gray-500 mt-1">
                    {[item.distance, item.duration].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              </Pressable>
            )}
          />

          {/* Action buttons */}
          <View className="px-5 pb-6 pt-2 gap-3">
            <Pressable
              onPress={() =>
                route.steps[activeStep] && speakStep(route.steps[activeStep])
              }
              className="bg-slate-100 rounded-2xl py-4 flex-row items-center justify-center gap-2"
              accessibilityRole="button"
              accessibilityLabel="Read current step aloud"
            >
              <SpeakerWaveIcon size={22} color="#475569" />
              <Text className="text-slate-700 font-semibold text-lg">
                Read step
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(app)/navigate-active' as never,
                  params: {
                    address,
                    lat: latParam,
                    lng: lngParam,
                    mode: travelMode,
                  },
                })
              }
              className="rounded-2xl py-4 flex-row items-center justify-center gap-2"
              style={{
                backgroundColor:
                  travelMode === 'transit' ? '#16a34a' : '#2563eb',
              }}
              accessibilityRole="button"
              accessibilityLabel="Start navigation with detection"
            >
              <MapPinIcon size={22} color="#ffffff" />
              <Text className="text-white font-semibold text-lg">
                Start Navigation
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {!loading && !route && !error && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-500 text-base text-center">
            Enter a destination on the Home tab to plan a route.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
