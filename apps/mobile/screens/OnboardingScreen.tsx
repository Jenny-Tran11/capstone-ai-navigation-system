import * as React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/ui/button";
import { useOnboarding } from "../context/OnboardingContext";

export function OnboardingScreen() {
  const { completeOnboarding } = useOnboarding();

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      edges={["top", "left", "right"]}
      accessibilityLabel="Welcome to BlindNav"
    >
      <View className="flex-1 justify-between px-4 py-6">
        <View className="gap-4">
          <Text
            className="text-2xl font-bold text-neutral-900"
            accessibilityRole="header"
          >
            Welcome to BlindNav
          </Text>
          <Text className="text-base leading-6 text-neutral-600">
            AI-assisted navigation for outdoor walking. Next, you will allow
            location and camera when prompted (MOB-004). For now, continue to the
            main app.
          </Text>
        </View>
        <Button
          label="Get started"
          onPress={completeOnboarding}
          accessibilityLabel="Get started"
          accessibilityHint="Opens the main app with Home, Navigate, Detect, and Settings"
        />
      </View>
    </SafeAreaView>
  );
}
