import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import {
  ArrowsRightLeftIcon,
  ClockIcon,
  MapPinIcon,
  SpeakerWaveIcon,
} from 'react-native-heroicons/outline';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getWalkingRoute, type Route, type RouteStep, type MapPoint } from './routing-service';

export default function NavigatePlanScreen() {
  const { address, lat: latParam, lng: lngParam } = useLocalSearchParams<{
    address?: string;
    lat?: string;
    lng?: string;
  }>();
  const destCoords = {
    lat: latParam ? Number.parseFloat(latParam) : 0,
    lng: lngParam ? Number.parseFloat(lngParam) : 0,
  };
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [userLocation, setUserLocation] = useState<MapPoint | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const mapRef = useRef<MapView>(null);
  // Prevent re-fetching once we have a real-origin route
  const hasFetchedRef = useRef(false);

  // Fetch route once we have real GPS; fall back to destination-only if denied
  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationDenied(true);
        // Fetch with dest as origin so the step list is at least visible
        try {
          const r = await getWalkingRoute(destCoords, destCoords);
          setRoute(r);
        } catch {
          setError('Could not find a route. Check your connection.');
        } finally {
          setLoading(false);
        }
        return;
      }

      // One-shot high-accuracy fix
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const origin = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

        const r = await getWalkingRoute(origin, destCoords);
        setRoute(r);
        hasFetchedRef.current = true;

        if (r.polylinePoints.length > 0) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(r.polylinePoints, {
              edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
              animated: true,
            });
          }, 500);
        }
      } catch {
        setError('Could not find a route. Check your connection.');
      } finally {
        setLoading(false);
      }

      // Continue watching position for the live user marker (no re-fetch needed)
      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        (loc) => {
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        },
      );

      return () => { sub.remove(); };
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, latParam, lngParam]);

  const speakStep = (step: RouteStep) => {
    Speech.speak(step.instruction, { language: 'en-AU', rate: 1.0 });
  };

  const destPoint: MapPoint = {
    latitude: destCoords.lat || -33.8703,
    longitude: destCoords.lng || 151.2117,
  };

  const mapCenter = route?.polylinePoints?.[0] ?? userLocation ?? destPoint;

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

      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-3">Getting your location…</Text>
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
                  strokeColor="#2563eb"
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
              <Text className="text-sm text-gray-600">{route.totalDistance}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <ClockIcon size={16} color="#475569" />
              <Text className="text-sm text-gray-600">{route.totalDuration}</Text>
            </View>
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
                <View className="w-7 h-7 rounded-full bg-primary items-center justify-center shrink-0 mt-0.5">
                  <Text className="text-white text-xs font-bold">{index + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base text-gray-900">{item.instruction}</Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {item.distance} · {item.duration}
                  </Text>
                </View>
              </Pressable>
            )}
          />

          {/* Action buttons */}
          <View className="px-5 pb-6 pt-2 gap-3">
            <Pressable
              onPress={() => route.steps[activeStep] && speakStep(route.steps[activeStep])}
              className="bg-slate-100 rounded-2xl py-4 flex-row items-center justify-center gap-2"
              accessibilityRole="button"
              accessibilityLabel="Read current step aloud"
            >
              <SpeakerWaveIcon size={22} color="#475569" />
              <Text className="text-slate-700 font-semibold text-lg">Read step</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(app)/navigate-active' as never,
                  params: { address, lat: latParam, lng: lngParam },
                })
              }
              className="bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-2"
              accessibilityRole="button"
              accessibilityLabel="Start navigation with detection"
            >
              <MapPinIcon size={22} color="#ffffff" />
              <Text className="text-white font-semibold text-lg">Start Navigation</Text>
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
