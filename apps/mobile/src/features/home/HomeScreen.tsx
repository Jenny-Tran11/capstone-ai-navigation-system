import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SosTrigger } from '@/components/SosTrigger';
import {
  BookmarkIcon,
  ClockIcon,
  Cog6ToothIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  StarIcon,
} from 'react-native-heroicons/outline';
import { StarIcon as StarSolid } from 'react-native-heroicons/solid';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/features/profile/use-profile';
import { usePreferences } from '@/hooks/use-preferences';
import { apiClient } from '@/lib/api-client';
import {
  type NearbyPlace,
  placesAutocomplete,
  placesDetailsGeometry,
  placesGeocodeAddress,
  placesNearbyTransitPoi,
} from '@/lib/places-api';
import {
  addRecentDestination,
  type Destination,
  getRecentDestinations,
} from '@/lib/storage';

type PlaceSuggestion = Destination & { placeId?: string };

async function fetchPlaceSuggestions(
  input: string,
  userLocation: { latitude: number; longitude: number } | null,
): Promise<PlaceSuggestion[]> {
  const predictions = await placesAutocomplete(input, userLocation);
  return predictions.map((p) => ({
    label: p.description,
    address: p.description,
    lat: 0,
    lng: 0,
    placeId: p.place_id,
  }));
}

async function geocodeDestination(dest: PlaceSuggestion): Promise<Destination> {
  if (!dest.placeId || dest.lat !== 0 || dest.lng !== 0) return dest;
  const loc = await placesDetailsGeometry(dest.placeId);
  if (loc)
    return {
      label: dest.label,
      address: dest.address,
      lat: loc.lat,
      lng: loc.lng,
    };
  return dest;
}

async function geocodeByAddress(
  address: string,
): Promise<{ lat: number; lng: number }> {
  const loc = await placesGeocodeAddress(address);
  if (loc) return loc;
  return { lat: 0, lng: 0 };
}

export default function HomeScreen() {
  const { profile } = useProfile();
  const { prefs } = usePreferences();
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<Destination[]>([]);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<Destination[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getRecentDestinations().then(setRecents);
  }, []);

  // Load saved places from preferences API
  useEffect(() => {
    apiClient
      .get<{ savedPlaces?: Destination[] }>('/user-profile/user/preferences')
      .then((r) => setSavedPlaces(r.data.savedPlaces ?? []))
      .catch(() => {});
  }, []);

  // Get user location for autocomplete biasing (best-effort)
  useEffect(() => {
    Location.requestForegroundPermissionsAsync()
      .then(({ status }) => {
        if (status !== 'granted') return;
        return Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      })
      .then((loc) => {
        if (loc) {
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Nearby transit/station/POI quick picks (best-effort).
  useEffect(() => {
    if (!userLocation) return;
    let cancelled = false;
    void placesNearbyTransitPoi(userLocation).then((places) => {
      if (!cancelled) setNearbyPlaces(places);
    });
    return () => {
      cancelled = true;
    };
  }, [userLocation]);

  // Debounced autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await fetchPlaceSuggestions(query, userLocation);
      setSuggestions(results);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, userLocation]);

  const handleNavigate = useCallback(
    async (dest: PlaceSuggestion) => {
      setQuery('');
      setSuggestions([]);
      let geocoded = await geocodeDestination(dest);

      // If still no coords (preferred location set via onboarding with lat:0), geocode by address text
      if (geocoded.lat === 0 && geocoded.lng === 0 && geocoded.address) {
        const resolved = await geocodeByAddress(geocoded.address);
        if (resolved.lat !== 0 || resolved.lng !== 0) {
          geocoded = { ...geocoded, ...resolved };
          // Write-through: persist resolved coords back to preferences so future taps are instant
          const updatedLocations = prefs?.preferredLocations?.map((loc) =>
            loc.address === dest.address ? { ...loc, ...resolved } : loc,
          );
          if (updatedLocations) {
            apiClient
              .put('/user-profile/user/preferences', {
                preferredLocations: updatedLocations,
              })
              .catch(() => {});
          }
        }
      }

      await addRecentDestination(geocoded);
      setRecents((prev) =>
        [geocoded, ...prev.filter((d) => d.address !== geocoded.address)].slice(
          0,
          5,
        ),
      );
      router.push({
        pathname: '/(app)/(tabs)/navigate',
        params: {
          address: geocoded.address,
          lat: String(geocoded.lat),
          lng: String(geocoded.lng),
        },
      });
    },
    [prefs?.preferredLocations],
  );

  const toggleSaved = useCallback(
    async (dest: Destination) => {
      const isSaved = savedPlaces.some((s) => s.address === dest.address);
      const next = isSaved
        ? savedPlaces.filter((s) => s.address !== dest.address)
        : [dest, ...savedPlaces].slice(0, 10);
      setSavedPlaces(next);
      await apiClient
        .put('/user-profile/user/preferences', { savedPlaces: next })
        .catch(() => {});
    },
    [savedPlaces],
  );

  const isSaved = useCallback(
    (dest: Destination) => savedPlaces.some((s) => s.address === dest.address),
    [savedPlaces],
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 pt-5 pb-4">
        {profile?.displayName ? (
          <Text className="text-sm text-slate-500 mb-1">
            Hi, {profile.displayName}
          </Text>
        ) : null}
        <Text className="text-3xl font-bold text-slate-900">Where to?</Text>
        <Text className="text-slate-500 mt-1">
          Search an Australian street address or choose from saved and recent
          destinations.
        </Text>
      </View>

      <View className="px-5 mb-3">
        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 gap-3 border border-slate-200 shadow-sm">
          <MagnifyingGlassIcon size={20} color="#64748b" />
          <TextInput
            className="flex-1 text-base text-slate-900"
            placeholder="Search Australian street address…"
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
            returnKeyType="go"
            onSubmitEditing={() => {
              if (query.trim()) {
                void handleNavigate({
                  label: query,
                  address: query,
                  lat: 0,
                  lng: 0,
                  placeId: undefined,
                });
              }
            }}
            accessibilityLabel="Destination search"
          />
        </View>

        {/* Autocomplete suggestions */}
        {suggestions.length > 0 ? (
          <View className="bg-white border border-slate-200 rounded-2xl mt-2 overflow-hidden shadow-sm">
            {suggestions.slice(0, 5).map((s) => (
              <Pressable
                key={s.address}
                onPress={() => void handleNavigate(s)}
                className="flex-row items-center px-4 py-3 border-b border-slate-100 gap-3"
                accessibilityRole="button"
              >
                <MagnifyingGlassIcon size={18} color="#94a3b8" />
                <Text
                  className="flex-1 text-base text-slate-800"
                  numberOfLines={1}
                >
                  {s.label}
                </Text>
                <Pressable
                  onPress={() => void toggleSaved(s)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isSaved(s) ? 'Remove from saved' : 'Save place'
                  }
                >
                  {isSaved(s) ? (
                    <StarSolid size={18} color="#2563eb" />
                  ) : (
                    <StarIcon size={18} color="#94a3b8" />
                  )}
                </Pressable>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <FlatList
        data={[]}
        keyExtractor={() => ''}
        renderItem={null}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <>
            {/* Preferred locations */}
            {prefs?.preferredLocations?.length ? (
              <View className="px-5 mb-4">
                <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Preferred
                </Text>
                <View className="rounded-2xl bg-white border border-slate-200 px-4">
                  {prefs.preferredLocations.map((place) => (
                    <Pressable
                      key={`${place.tag}:${place.address}`}
                      onPress={() => void handleNavigate(place)}
                      className="flex-row items-center py-3 gap-3 border-b border-slate-100"
                      accessibilityRole="button"
                    >
                      <BookmarkIcon size={22} color="#1d4ed8" />
                      <View className="flex-1">
                        <Text
                          className="text-base text-slate-900"
                          numberOfLines={1}
                        >
                          {place.label}
                        </Text>
                        <Text
                          className="text-sm text-slate-500"
                          numberOfLines={1}
                        >
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

            {/* Saved places */}
            {savedPlaces.length > 0 ? (
              <View className="px-5 mb-4">
                <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Saved
                </Text>
                <View className="rounded-2xl bg-white border border-slate-200 px-4">
                  {savedPlaces.slice(0, 5).map((s) => (
                    <Pressable
                      key={s.address}
                      onPress={() => void handleNavigate(s)}
                      className="flex-row items-center py-3 gap-3 border-b border-slate-100"
                      accessibilityRole="button"
                    >
                      <BookmarkIcon size={22} color="#2563eb" />
                      <Text
                        className="flex-1 text-base text-slate-900"
                        numberOfLines={1}
                      >
                        {s.label}
                      </Text>
                      <Pressable
                        onPress={() => void toggleSaved(s)}
                        hitSlop={8}
                        accessibilityRole="button"
                      >
                        <StarSolid size={18} color="#2563eb" />
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Recents */}
            {recents.length > 0 ? (
              <View className="px-5 mb-4">
                <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Recent
                </Text>
                <View className="rounded-2xl bg-white border border-slate-200 px-4">
                  {recents.map((item) => (
                    <Pressable
                      key={item.address}
                      onPress={() => void handleNavigate(item)}
                      className="flex-row items-center py-3 gap-3 border-b border-slate-100"
                      accessibilityRole="button"
                    >
                      <ClockIcon size={22} color="#64748b" />
                      <View className="flex-1">
                        <Text
                          className="text-base text-slate-900"
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                        <Text
                          className="text-sm text-slate-500"
                          numberOfLines={1}
                        >
                          {item.address}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => void toggleSaved(item)}
                        hitSlop={8}
                        accessibilityRole="button"
                      >
                        {isSaved(item) ? (
                          <StarSolid size={18} color="#2563eb" />
                        ) : (
                          <StarIcon size={18} color="#94a3b8" />
                        )}
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              <View className="px-5 mb-4">
                <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Recent
                </Text>
                <View className="rounded-2xl bg-white border border-dashed border-slate-300 p-4">
                  <Text className="text-sm text-slate-500">
                    No recent destinations yet. Search above to get started.
                  </Text>
                </View>
              </View>
            )}

            {/* Nearby transit + POI */}
            {nearbyPlaces.length > 0 ? (
              <View className="px-5 mb-4">
                <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Nearby Transit & POI
                </Text>
                <View className="rounded-2xl bg-white border border-slate-200 px-4">
                  {nearbyPlaces.map((place) => (
                    <Pressable
                      key={`${place.label}:${place.lat},${place.lng}`}
                      onPress={() => void handleNavigate(place)}
                      className="flex-row items-center py-3 gap-3 border-b border-slate-100"
                      accessibilityRole="button"
                    >
                      <MagnifyingGlassIcon size={20} color="#0f766e" />
                      <View className="flex-1">
                        <Text
                          className="text-base text-slate-900"
                          numberOfLines={1}
                        >
                          {place.label}
                        </Text>
                        <Text
                          className="text-sm text-slate-500"
                          numberOfLines={1}
                        >
                          {place.address}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Quick actions */}
            <View className="px-5 mt-1 mb-2">
              <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Quick Actions
              </Text>
            </View>
            <View className="px-5 flex-row gap-3">
              <Pressable
                onPress={() => router.push('/(app)/(tabs)/detect')}
                className="flex-1 bg-blue-50 border border-blue-100 rounded-2xl p-4 items-center gap-1"
                accessibilityRole="button"
              >
                <EyeIcon size={32} color="#1d4ed8" />
                <Text className="text-sm font-medium text-slate-700">
                  Detect
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(app)/(tabs)/settings')}
                className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 items-center gap-1"
                accessibilityRole="button"
              >
                <Cog6ToothIcon size={32} color="#475569" />
                <Text className="text-sm font-medium text-slate-700">
                  Settings
                </Text>
              </Pressable>
            </View>
          </>
        }
      />

      {/* SOS FAB — bottom-right */}
      <View
        style={{ position: 'absolute', bottom: 24, right: 20 }}
        pointerEvents="box-none"
      >
        <SosTrigger
          contactPhone={prefs?.emergencyContact?.phone}
          contactName={prefs?.emergencyContact?.name}
        />
      </View>
    </SafeAreaView>
  );
}
