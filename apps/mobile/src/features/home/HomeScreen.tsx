import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
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
import { getRuntimeConfig } from '@/lib/runtime-config';
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
  const { googleMapsApiKey } = await getRuntimeConfig();
  if (!googleMapsApiKey) return [];
  try {
    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${googleMapsApiKey}&types=establishment|geocode`;
    if (userLocation) {
      url += `&location=${userLocation.latitude},${userLocation.longitude}&radius=5000`;
    }
    const res = await fetch(url);
    const data = await res.json();
    return (data.predictions ?? []).map(
      (p: { description: string; place_id: string }) => ({
        label: p.description,
        address: p.description,
        lat: 0,
        lng: 0,
        placeId: p.place_id,
      }),
    );
  } catch {
    return [];
  }
}

async function geocodeDestination(dest: PlaceSuggestion): Promise<Destination> {
  if (!dest.placeId || dest.lat !== 0 || dest.lng !== 0) return dest;
  const { googleMapsApiKey } = await getRuntimeConfig();
  if (!googleMapsApiKey) return dest;
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(dest.placeId)}&fields=geometry&key=${googleMapsApiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    const loc = data.result?.geometry?.location;
    if (loc)
      return {
        label: dest.label,
        address: dest.address,
        lat: loc.lat,
        lng: loc.lng,
      };
  } catch {
    // fall through to geocodeByAddress
  }
  return dest;
}

async function geocodeByAddress(
  address: string,
): Promise<{ lat: number; lng: number }> {
  const { googleMapsApiKey } = await getRuntimeConfig();
  if (!googleMapsApiKey) return { lat: 0, lng: 0 };
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    const loc = data.results?.[0]?.geometry?.location;
    if (loc) return { lat: loc.lat, lng: loc.lng };
  } catch {
    // fall through
  }
  return { lat: 0, lng: 0 };
}

export default function HomeScreen() {
  const { profile } = useProfile();
  const { prefs } = usePreferences();
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<Destination[]>([]);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<Destination[]>([]);
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
          Search a place or choose from your saved and recent destinations.
        </Text>
      </View>

      <View className="px-5 mb-3">
        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 gap-3 border border-slate-200 shadow-sm">
          <MagnifyingGlassIcon size={20} color="#64748b" />
          <TextInput
            className="flex-1 text-base text-slate-900"
            placeholder="Search destination..."
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
    </SafeAreaView>
  );
}
