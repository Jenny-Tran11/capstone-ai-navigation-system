import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { MagnifyingGlassIcon } from 'react-native-heroicons/outline';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/lib/api-client';
import { getRuntimeConfig } from '@/lib/runtime-config';
import { markOnboardingDone, savePreferences, type UserPreferences } from '@/lib/storage';

type FieldKey = 'home' | 'work';

type Suggestion = {
  placeId: string;
  description: string;
  lat: number;
  lng: number;
};

type ResolvedLocation = {
  address: string;
  lat: number;
  lng: number;
};

type PreferredLocation = UserPreferences['preferredLocations'][number];

async function fetchAutocomplete(query: string, mapsKey: string): Promise<Suggestion[]> {
  if (!query.trim() || !mapsKey) return [];
  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${mapsKey}&types=address`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.predictions ?? []).map(
      (p: { place_id: string; description: string }) => ({
        placeId: p.place_id,
        description: p.description,
        lat: 0,
        lng: 0,
      }),
    );
  } catch {
    return [];
  }
}

async function geocodePlaceId(placeId: string, mapsKey: string): Promise<{ lat: number; lng: number }> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=geometry&key=${mapsKey}`;
    const res = await fetch(url);
    const data = await res.json();
    const loc = data.result?.geometry?.location;
    if (loc) return { lat: loc.lat, lng: loc.lng };
  } catch {
    // fall through
  }
  return { lat: 0, lng: 0 };
}

export default function OnboardingScreen() {
  const [mapsKey, setMapsKey] = useState('');
  const [configReady, setConfigReady] = useState(false);
  const [values, setValues] = useState<{ home: ResolvedLocation | null; work: ResolvedLocation | null }>({
    home: null,
    work: null,
  });
  const [inputText, setInputText] = useState<{ home: string; work: string }>({ home: '', work: '' });
  const [activeField, setActiveField] = useState<FieldKey | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getRuntimeConfig()
      .then((cfg) => {
        setMapsKey(cfg.googleMapsApiKey);
        setConfigReady(true);
      })
      .catch(() => setConfigReady(true));
  }, []);

  // Debounced autocomplete
  useEffect(() => {
    if (!activeField || !configReady) {
      setSuggestions([]);
      return;
    }
    const query = inputText[activeField];
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      const next = await fetchAutocomplete(query, mapsKey);
      setSuggestions(next);
      setLoadingSuggestions(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [activeField, configReady, mapsKey, inputText]);

  const handleSelect = async (field: FieldKey, suggestion: Suggestion) => {
    // Immediately geocode via Place Details so we have real coords at save time
    const coords = mapsKey
      ? await geocodePlaceId(suggestion.placeId, mapsKey)
      : { lat: 0, lng: 0 };
    setValues((prev) => ({
      ...prev,
      [field]: { address: suggestion.description, ...coords },
    }));
    setInputText((prev) => ({ ...prev, [field]: suggestion.description }));
    setSuggestions([]);
    setActiveField(null);
  };

  const canContinue = Boolean(values.home || values.work) && !saving;

  const handleContinue = async () => {
    if (!canContinue) return;
    setSaving(true);
    setError(null);
    try {
      const preferredLocations: PreferredLocation[] = [];
      if (values.home) {
        preferredLocations.push({ tag: 'home', label: 'Home', ...values.home });
      }
      if (values.work) {
        preferredLocations.push({ tag: 'work', label: 'Work', ...values.work });
      }
      await apiClient.put('/user-profile/user/preferences', { preferredLocations });
      await savePreferences({ preferredLocations });
      await markOnboardingDone();
      router.replace('/(app)/(tabs)/home');
    } catch {
      setError('Could not save locations. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, gap: 18 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-2">
          <Text className="text-3xl font-bold text-slate-900">Set your places</Text>
          <Text className="text-slate-500">
            Add Home and Work so navigation starts faster.
          </Text>
        </View>

        {!configReady ? (
          <View className="items-center py-6">
            <ActivityIndicator color="#2563eb" />
            <Text className="text-slate-500 mt-2 text-sm">Loading…</Text>
          </View>
        ) : (
          (['home', 'work'] as const).map((field) => (
            <View key={field} className="gap-2">
              <Text className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                {field}
              </Text>
              <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 gap-3">
                <MagnifyingGlassIcon size={18} color="#64748b" />
                <TextInput
                  value={inputText[field]}
                  onFocus={() => setActiveField(field)}
                  onChangeText={(text) => {
                    setInputText((prev) => ({ ...prev, [field]: text }));
                    // Clear resolved location if user edits the text manually
                    setValues((prev) => ({ ...prev, [field]: null }));
                    setActiveField(field);
                  }}
                  className="flex-1 text-base text-slate-900"
                  placeholder={`Search ${field} address`}
                  placeholderTextColor="#94a3b8"
                  accessibilityLabel={`${field} address`}
                />
              </View>

              {activeField === field && suggestions.length > 0 ? (
                <View className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {suggestions.slice(0, 5).map((s) => (
                    <Pressable
                      key={`${field}:${s.placeId}`}
                      className="px-4 py-3 border-b border-slate-100"
                      onPress={() => void handleSelect(field, s)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${s.description}`}
                    >
                      <Text className="text-slate-800" numberOfLines={1}>
                        {s.description}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {activeField === field &&
              inputText[field].trim() &&
              !loadingSuggestions &&
              suggestions.length === 0 ? (
                <Text className="text-xs text-slate-500">No matches found.</Text>
              ) : null}

              {/* Show resolved indicator once user selected a suggestion */}
              {values[field] ? (
                <Text className="text-xs text-green-600">✓ Location confirmed</Text>
              ) : null}
            </View>
          ))
        )}

        {error ? <Text className="text-sm text-red-500">{error}</Text> : null}

        <Pressable
          onPress={() => void handleContinue()}
          disabled={!canContinue}
          className={`rounded-2xl py-4 items-center mt-3 ${canContinue ? 'bg-primary' : 'bg-slate-300'}`}
          accessibilityRole="button"
          accessibilityLabel="Save preferred locations"
        >
          <Text className="text-base font-semibold text-white">
            {saving ? 'Saving…' : 'Continue'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
