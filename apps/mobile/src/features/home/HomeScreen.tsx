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
import { usePreferences } from '@/hooks/use-preferences';
import { useProfile } from '@/features/profile/use-profile';
import { apiClient } from '@/lib/api-client';
import { getRuntimeConfig } from '@/lib/runtime-config';
import {
  addRecentDestination,
  getRecentDestinations,
  type Destination,
} from '@/lib/storage';

type PlaceSuggestion = Destination & { placeId?: string };

const STATIC_SUGGESTIONS: PlaceSuggestion[] = [
  { label: 'Hospital', address: 'Hospital', lat: 0, lng: 0 },
  { label: 'Pharmacy', address: 'Pharmacy', lat: 0, lng: 0 },
  { label: 'Supermarket', address: 'Supermarket', lat: 0, lng: 0 },
  { label: 'Train station', address: 'Train station', lat: 0, lng: 0 },
  { label: 'Bus stop', address: 'Bus stop', lat: 0, lng: 0 },
  { label: 'Park', address: 'Park', lat: 0, lng: 0 },
];

async function fetchPlaceSuggestions(
  input: string,
  mapsKey: string,
): Promise<PlaceSuggestion[]> {
  if (!mapsKey) {
    return STATIC_SUGGESTIONS.filter((s) =>
      s.label.toLowerCase().includes(input.toLowerCase()),
    );
  }
  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${mapsKey}&types=establishment|geocode`;
    const { data } = await apiClient.get<{
      predictions: { description: string; place_id: string }[];
    }>(url);
    return (data.predictions ?? []).map((p) => ({
      label: p.description,
      address: p.description,
      lat: 0,
      lng: 0,
      placeId: p.place_id,
    }));
  } catch {
    return STATIC_SUGGESTIONS.filter((s) =>
      s.label.toLowerCase().includes(input.toLowerCase()),
    );
  }
}

async function geocodeDestination(
  dest: PlaceSuggestion,
  mapsKey: string,
): Promise<Destination> {
  if (!mapsKey || !dest.placeId || dest.lat !== 0 || dest.lng !== 0) {
    return dest;
  }
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${dest.placeId}&fields=geometry&key=${mapsKey}`;
    const { data } = await apiClient.get<{
      result?: { geometry?: { location?: { lat: number; lng: number } } };
    }>(url);
    const loc = data.result?.geometry?.location;
    if (loc)
      return {
        label: dest.label,
        address: dest.address,
        lat: loc.lat,
        lng: loc.lng,
      };
  } catch {
    // fall through — use ungeocoded destination (mock route will apply)
  }
  return dest;
}

async function geocodeByAddress(
  address: string,
  mapsKey: string,
): Promise<{ lat: number; lng: number }> {
  if (!mapsKey) return { lat: 0, lng: 0 };
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${mapsKey}`;
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
  const [mapsKey, setMapsKey] = useState(
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  );
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<Destination[]>([]);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<Destination[]>([]);
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

  useEffect(() => {
    getRuntimeConfig()
      .then((cfg) => setMapsKey(cfg.googleMapsApiKey))
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
      const results = await fetchPlaceSuggestions(query, mapsKey);
      setSuggestions(results);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, mapsKey]);

  const handleNavigate = useCallback(
    async (dest: PlaceSuggestion) => {
      setQuery('');
      setSuggestions([]);
      let geocoded = await geocodeDestination(dest, mapsKey);

      // If still no coords (preferred location set via onboarding with lat:0), geocode by address text
      if (geocoded.lat === 0 && geocoded.lng === 0 && geocoded.address) {
        const resolved = await geocodeByAddress(geocoded.address, mapsKey);
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
    [mapsKey, prefs?.preferredLocations],
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
            {/* Saved places */}
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
