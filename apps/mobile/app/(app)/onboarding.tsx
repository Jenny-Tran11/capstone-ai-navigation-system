import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/lib/api-client';
import {
  markOnboardingDone,
  savePreferences,
  type UserPreferences,
} from '@/lib/storage';

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

type PreferredLocation = UserPreferences['preferredLocations'][number];

async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number }> {
  if (!MAPS_KEY) return { lat: 0, lng: 0 };
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${MAPS_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const loc = data.results?.[0]?.geometry?.location;
    if (loc) return { lat: loc.lat, lng: loc.lng };
  } catch {
    // fall through
  }
  return { lat: 0, lng: 0 };
}

async function buildPreferredLocations(
  homeAddress: string,
  workAddress: string,
): Promise<PreferredLocation[]> {
  const next: PreferredLocation[] = [];
  if (homeAddress.trim()) {
    const { lat, lng } = await geocodeAddress(homeAddress.trim());
    next.push({
      tag: 'home',
      label: 'Home',
      address: homeAddress.trim(),
      lat,
      lng,
    });
  }
  if (workAddress.trim()) {
    const { lat, lng } = await geocodeAddress(workAddress.trim());
    next.push({
      tag: 'work',
      label: 'Work',
      address: workAddress.trim(),
      lat,
      lng,
    });
  }
  return next;
}

export default function OnboardingScreen() {
  const [homeAddress, setHomeAddress] = useState('');
  const [workAddress, setWorkAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = useMemo(
    () => Boolean(homeAddress.trim() || workAddress.trim()) && !loading,
    [homeAddress, workAddress, loading],
  );

  const handleContinue = async () => {
    setLoading(true);
    setError(null);
    try {
      const preferredLocations = await buildPreferredLocations(
        homeAddress,
        workAddress,
      );
      if (preferredLocations.length === 0) {
        setError('Add at least Home or Work to continue.');
        setLoading(false);
        return;
      }
      await apiClient.put('/user-profile/user/preferences', {
        preferredLocations,
      });
      await savePreferences({ preferredLocations });
      await markOnboardingDone();
      router.replace('/(app)/(tabs)/home');
    } catch {
      setError('Could not save locations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-10 pb-6">
        <Text className="text-3xl font-bold text-slate-900">
          Set your places
        </Text>
        <Text className="mt-2 text-slate-500">
          Add places you use most so navigation starts faster.
        </Text>

        <View className="mt-8 gap-4">
          <View>
            <Text className="mb-2 text-sm font-semibold text-slate-600">
              Home
            </Text>
            <TextInput
              value={homeAddress}
              onChangeText={setHomeAddress}
              placeholder="e.g. 12 George St, Sydney"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
              placeholderTextColor="#94a3b8"
              accessibilityLabel="Home location"
            />
          </View>

          <View>
            <Text className="mb-2 text-sm font-semibold text-slate-600">
              Work
            </Text>
            <TextInput
              value={workAddress}
              onChangeText={setWorkAddress}
              placeholder="e.g. 1 Martin Pl, Sydney"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
              placeholderTextColor="#94a3b8"
              accessibilityLabel="Work location"
            />
          </View>
        </View>

        {error ? (
          <Text className="mt-4 text-sm text-red-500">{error}</Text>
        ) : null}

        <View className="mt-auto">
          <Pressable
            onPress={() => void handleContinue()}
            disabled={!canContinue}
            className={`rounded-2xl py-4 items-center ${canContinue ? 'bg-primary' : 'bg-slate-300'}`}
            accessibilityRole="button"
            accessibilityLabel="Save preferred locations"
          >
            <Text className="text-lg font-semibold text-white">
              {loading ? 'Saving…' : 'Continue'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
