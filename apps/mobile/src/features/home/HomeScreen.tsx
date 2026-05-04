import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import {
  ClockIcon,
  Cog6ToothIcon,
  EyeIcon,
  MagnifyingGlassIcon,
} from 'react-native-heroicons/outline';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addRecentDestination, getRecentDestinations, type Destination } from '@/lib/storage';

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<Destination[]>([]);

  useEffect(() => {
    getRecentDestinations().then(setRecents);
  }, []);

  const handleNavigate = async () => {
    if (!query.trim()) return;
    const dest: Destination = { label: query, address: query, lat: 0, lng: 0 };
    await addRecentDestination(dest);
    router.push({ pathname: '/(app)/(tabs)/navigate', params: { address: query } });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 pt-6 pb-4">
        <Text className="text-3xl font-bold text-gray-900">Where to?</Text>
        <Text className="text-gray-500 mt-1">Enter a destination or pick from recents</Text>
      </View>

      <View className="px-5 mb-6">
        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 gap-3">
          <MagnifyingGlassIcon size={22} color="#64748b" />
          <TextInput
            className="flex-1 text-base text-gray-900"
            placeholder="Search destination..."
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
            returnKeyType="go"
            onSubmitEditing={handleNavigate}
            accessibilityLabel="Destination search"
          />
        </View>

        {query.trim() ? (
          <Pressable
            onPress={handleNavigate}
            className="bg-primary mt-3 rounded-2xl py-4 items-center"
            accessibilityRole="button"
            accessibilityLabel="Navigate to destination"
          >
            <Text className="text-white font-semibold text-lg">Navigate</Text>
          </Pressable>
        ) : null}
      </View>

      {recents.length > 0 && (
        <View className="px-5">
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent</Text>
          <FlatList
            data={recents}
            keyExtractor={(item) => item.address}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View className="h-px bg-gray-100" />}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/(app)/(tabs)/navigate', params: { address: item.address } })
                }
                className="flex-row items-center py-3 gap-3"
                accessibilityRole="button"
              >
                <ClockIcon size={22} color="#64748b" />
                <View className="flex-1">
                  <Text className="text-base text-gray-900" numberOfLines={1}>{item.label}</Text>
                  <Text className="text-sm text-gray-500" numberOfLines={1}>{item.address}</Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      )}

      {/* Quick actions */}
      <View className="px-5 mt-6 flex-row gap-3">
        <Pressable
          onPress={() => router.push('/(app)/(tabs)/detect')}
          className="flex-1 bg-blue-50 rounded-2xl p-4 items-center gap-1"
          accessibilityRole="button"
        >
          <EyeIcon size={32} color="#1d4ed8" />
          <Text className="text-sm font-medium text-gray-700">Detect</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(app)/(tabs)/settings')}
          className="flex-1 bg-gray-50 rounded-2xl p-4 items-center gap-1"
          accessibilityRole="button"
        >
          <Cog6ToothIcon size={32} color="#475569" />
          <Text className="text-sm font-medium text-gray-700">Settings</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
