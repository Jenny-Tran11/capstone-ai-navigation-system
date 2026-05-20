import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ArrowsRightLeftIcon,
  BookmarkIcon,
  ClockIcon,
  MagnifyingGlassIcon,
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
import {
  placesAutocomplete,
  placesDetailsGeometry,
  placesGeocodeAddress,
} from '@/lib/places-api';
import { type Destination, getRecentDestinations } from '@/lib/storage';

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

  const paramDestCoords = useMemo(() => {
    const latRaw = latParam ?? latitudeParam ?? '';
    const lngRaw = lngParam ?? longitudeParam ?? '';
    return {
      lat: latRaw ? Number.parseFloat(latRaw) : Number.NaN,
      lng: lngRaw ? Number.parseFloat(lngRaw) : Number.NaN,
    };
  }, [latParam, lngParam, latitudeParam, longitudeParam]);

  // Inline destination — set when user picks from recents or search within this tab
  const [inlineAddress, setInlineAddress] = useState<string | undefined>();
  const [inlineCoords, setInlineCoords] = useState<{ lat: number; lng: number } | undefined>();

  const effectiveAddress = inlineAddress ?? address;
  const destCoords = inlineCoords ?? paramDestCoords;

  const hasValidDestination =
    Number.isFinite(destCoords.lat) &&
    Number.isFinite(destCoords.lng) &&
    Math.abs(destCoords.lat) <= 90 &&
    Math.abs(destCoords.lng) <= 180;

  const [travelMode, setTravelMode] = useState<TravelMode>('walking');
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [userLocation, setUserLocation] = useState<MapPoint | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [routeRefreshTick, setRouteRefreshTick] = useState(0);
  const mapRef = useRef<MapView>(null);
  const { prefs } = usePreferences();

  // Quick-picks: recent destinations
  const [recents, setRecents] = useState<Destination[]>([]);
  useEffect(() => {
    getRecentDestinations().then(setRecents);
  }, []);

  // Inline destination search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<
    { label: string; placeId: string }[]
  >([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pickLoading, setPickLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!searchQuery.trim()) { setSearchSuggestions([]); return; }
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const preds = await placesAutocomplete(searchQuery, null);
        setSearchSuggestions(preds.map((p) => ({ label: p.description, placeId: p.place_id })));
      } catch { /* ignore */ }
      setSearchLoading(false);
    }, 400);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchQuery]);

  const handleInlinePick = async (
    label: string,
    opts?: { placeId?: string; lat?: number; lng?: number },
  ) => {
    setSearchQuery('');
    setSearchSuggestions([]);
    setError(null);

    let lat = opts?.lat;
    let lng = opts?.lng;

    const needsGeocode =
      !Number.isFinite(lat) || !Number.isFinite(lng) ||
      lat === 0 || lng === 0;

    if (needsGeocode) {
      setPickLoading(true);
      try {
        if (opts?.placeId) {
          const loc = await placesDetailsGeometry(opts.placeId);
          if (loc) { lat = loc.lat; lng = loc.lng; }
        }
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) {
          const loc = await placesGeocodeAddress(label);
          if (loc) { lat = loc.lat; lng = loc.lng; }
        }
      } catch {
        // fall through to the error below
      } finally {
        setPickLoading(false);
      }
    }

    if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
      setInlineAddress(label);
      setInlineCoords({ lat: lat as number, lng: lng as number });
      setRouteRefreshTick((v) => v + 1);
    } else {
      setError(`Could not find coordinates for "${label}". Try searching manually.`);
    }
  };


  useEffect(() => {
    if (!effectiveAddress) {
      setLoading(false);
      return;
    }
    if (!hasValidDestination) {
      setLoading(false);
      setError('Destination coordinates are invalid. Please search again.');
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
        setError('Location access is required to plan a route. Please enable it in Settings.');
        setLoading(false);
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

        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 5 },
          (loc) => {
            setUserLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          },
        );
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Could not find a route. Check your connection.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      sub?.remove();
    };
  }, [effectiveAddress, destCoords, hasValidDestination, travelMode, routeRefreshTick]);

  const speakStep = (step: RouteStep) => {
    Speech.speak(step.instruction, {
      language: prefs?.speechLanguage ?? 'en-AU',
      rate: prefs?.speechRate ?? 1.0,
    });
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
        {effectiveAddress ? (
          <Text className="text-gray-500 mt-1" numberOfLines={1}>
            To: {effectiveAddress}
          </Text>
        ) : null}
      </View>

      {/* Travel mode toggle */}
      <View className="pt-3">
        <ModeToggle mode={travelMode} onChange={setTravelMode} />
      </View>


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
                    address: effectiveAddress,
                    lat: String(destCoords.lat),
                    lng: String(destCoords.lng),
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

      {/* ── Inline destination picker — shown when no destination is set ── */}
      {!effectiveAddress && !loading && (
        <View className="flex-1 px-5 pt-4">
          {pickLoading ? (
            <View className="items-center py-6 gap-2">
              <ActivityIndicator size="large" color="#2563eb" />
              <Text className="text-slate-500 text-sm">Looking up location…</Text>
            </View>
          ) : null}
          {/* Search bar */}
          {!pickLoading ? (
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 gap-3 border border-slate-200 shadow-sm mb-4">
            <MagnifyingGlassIcon size={20} color="#64748b" />
            <TextInput
              className="flex-1 text-base text-slate-900"
              placeholder="Search destination…"
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              accessibilityLabel="Search destination"
              autoFocus={false}
            />
            {searchLoading ? <ActivityIndicator size="small" color="#2563eb" /> : null}
          </View>
          ) : null}

          {/* Search suggestions / preferred / recents — hidden while geocoding */}
          {!pickLoading && searchSuggestions.length > 0 ? (
            <View className="bg-white border border-slate-200 rounded-2xl mb-4 overflow-hidden shadow-sm">
              {searchSuggestions.slice(0, 5).map((s) => (
                <Pressable
                  key={s.placeId}
                  onPress={() => void handleInlinePick(s.label, { placeId: s.placeId })}
                  className="flex-row items-center px-4 py-3 border-b border-slate-100 gap-3"
                  accessibilityRole="button"
                  accessibilityLabel={s.label}
                >
                  <MagnifyingGlassIcon size={16} color="#94a3b8" />
                  <Text className="flex-1 text-base text-slate-800" numberOfLines={1}>
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {/* Preferred locations */}
          {!pickLoading && !searchQuery && prefs?.preferredLocations?.length ? (
            <View className="mb-4">
              <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Preferred
              </Text>
              <View className="bg-white rounded-2xl border border-slate-200 px-4">
                {prefs.preferredLocations.map((place) => (
                  <Pressable
                    key={`${place.tag}:${place.address}`}
                    onPress={() =>
                      void handleInlinePick(place.address, {
                        lat: place.lat || undefined,
                        lng: place.lng || undefined,
                      })
                    }
                    className="flex-row items-center py-3 gap-3 border-b border-slate-100"
                    accessibilityRole="button"
                    accessibilityLabel={place.label}
                  >
                    <BookmarkIcon size={20} color="#1d4ed8" />
                    <View className="flex-1">
                      <Text className="text-base text-slate-900" numberOfLines={1}>
                        {place.label}
                      </Text>
                      <Text className="text-sm text-slate-500" numberOfLines={1}>
                        {place.address}
                      </Text>
                    </View>
                    <Text className="text-xs font-semibold uppercase text-blue-700">
                      {place.tag}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {/* Recents */}
          {!pickLoading && !searchQuery && recents.length > 0 ? (
            <View className="mb-4">
              <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Recent
              </Text>
              <View className="bg-white rounded-2xl border border-slate-200 px-4">
                {recents.map((item) => (
                  <Pressable
                    key={item.address}
                    onPress={() =>
                      void handleInlinePick(item.address, {
                        lat: item.lat || undefined,
                        lng: item.lng || undefined,
                      })
                    }
                    className="flex-row items-center py-3 gap-3 border-b border-slate-100"
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                  >
                    <ClockIcon size={20} color="#64748b" />
                    <View className="flex-1">
                      <Text className="text-base text-slate-900" numberOfLines={1}>
                        {item.label}
                      </Text>
                      <Text className="text-sm text-slate-500" numberOfLines={1}>
                        {item.address}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {/* Fallback hint */}
          {!pickLoading && !searchQuery && !prefs?.preferredLocations?.length && recents.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <MapPinIcon size={48} color="#cbd5e1" />
              <Text className="text-slate-400 text-base text-center mt-3">
                Search above or save favourite places in Settings to see them here.
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}
