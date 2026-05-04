import * as Speech from 'expo-speech';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getWalkingRoute, type Route, type RouteStep } from './routing-service';

export default function NavigatePlanScreen() {
  const { address } = useLocalSearchParams<{ address?: string }>();
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setError(null);
    // Using mock coordinates; real app would geocode the address
    getWalkingRoute({ lat: -33.8688, lng: 151.2093 }, { lat: -33.8703, lng: 151.2117 })
      .then(setRoute)
      .catch(() => setError('Could not find a route. Check your connection.'))
      .finally(() => setLoading(false));
  }, [address]);

  const speakStep = (step: RouteStep) => {
    Speech.speak(step.instruction, { language: 'en-AU', rate: 1.0 });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 pt-6 pb-4 border-b border-gray-100">
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
          <Text className="text-gray-500 mt-3">Finding route...</Text>
        </View>
      )}

      {error && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-base text-center">{error}</Text>
        </View>
      )}

      {!loading && route && (
        <>
          <View className="px-5 py-3 bg-blue-50 flex-row gap-4">
            <Text className="text-sm text-gray-600">📏 {route.totalDistance}</Text>
            <Text className="text-sm text-gray-600">⏱ {route.totalDuration}</Text>
          </View>

          <FlatList
            data={route.steps}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ padding: 20, gap: 8 }}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => {
                  setActiveStep(index);
                  speakStep(item);
                }}
                className={`rounded-2xl p-4 flex-row items-start gap-3 ${
                  activeStep === index ? 'bg-blue-50 border border-primary' : 'bg-gray-50'
                }`}
                accessibilityRole="button"
                accessibilityLabel={`Step ${index + 1}: ${item.instruction}`}
              >
                <View className="w-7 h-7 rounded-full bg-primary items-center justify-center shrink-0 mt-0.5">
                  <Text className="text-white text-xs font-bold">{index + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base text-gray-900">{item.instruction}</Text>
                  <Text className="text-sm text-gray-500 mt-1">{item.distance} · {item.duration}</Text>
                </View>
              </Pressable>
            )}
          />

          <View className="px-5 pb-6">
            <Pressable
              onPress={() => speakStep(route.steps[activeStep])}
              className="bg-primary rounded-2xl py-4 items-center"
              accessibilityRole="button"
              accessibilityLabel="Read current step aloud"
            >
              <Text className="text-white font-semibold text-lg">🔊 Read step</Text>
            </Pressable>
          </View>
        </>
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
