import { StatusBar } from "expo-status-bar";
import { Text, View, ScrollView } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Button } from "./components/ui/button";
import { env, isDetectConfigured } from "./lib/env";

export default function App() {
  const configured = isDetectConfigured();

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView
          className="flex-1 px-4"
          contentContainerClassName="gap-4 py-6"
        >
          <Text className="text-2xl font-bold text-neutral-900">
            BlindNav
          </Text>
          <Text className="text-neutral-600">
            Expo + NativeWind + shadcn-style UI (CVA + tailwind). Configure the
            cloud detect API below.
          </Text>

          <View className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <Text className="mb-2 font-semibold text-neutral-800">
              API status
            </Text>
            <Text className="text-sm text-neutral-600">
              {configured
                ? "EXPO_PUBLIC_DETECT_API_URL and EXPO_PUBLIC_DETECT_API_KEY are set."
                : "Add .env from .env.example (EXPO_PUBLIC_* vars). Restart Expo after changes."}
            </Text>
            {__DEV__ && (
              <Text
                className="mt-2 font-mono text-xs text-neutral-500"
                selectable
              >
                URL: {env.detectApiUrl || "(empty)"}
              </Text>
            )}
          </View>

          <Button
            label="Primary action"
            onPress={() => {}}
            disabled={!configured}
          />
          <Button label="Outline" variant="outline" onPress={() => {}} />
        </ScrollView>
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
