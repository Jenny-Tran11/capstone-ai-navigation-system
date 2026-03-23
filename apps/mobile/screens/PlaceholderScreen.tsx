import * as React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/ui/button";

type PlaceholderScreenProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCtaPress?: () => void;
  ctaAccessibilityLabel: string;
  ctaAccessibilityHint?: string;
};

/**
 * Shared layout: title + body + primary CTA (text-base / 16px minimum via Button default).
 */
export function PlaceholderScreen({
  title,
  subtitle,
  ctaLabel,
  onCtaPress,
  ctaAccessibilityLabel,
  ctaAccessibilityHint,
}: PlaceholderScreenProps) {
  return (
    <SafeAreaView
      className="flex-1 bg-white"
      edges={["top", "left", "right"]}
      accessibilityLabel={`${title} screen`}
    >
      <View className="flex-1 justify-between px-4 py-6">
        <View className="gap-3">
          <Text
            className="text-2xl font-bold text-neutral-900"
            accessibilityRole="header"
          >
            {title}
          </Text>
          <Text className="text-base leading-6 text-neutral-600">{subtitle}</Text>
        </View>
        <Button
          label={ctaLabel}
          onPress={onCtaPress ?? (() => {})}
          accessibilityLabel={ctaAccessibilityLabel}
          accessibilityHint={ctaAccessibilityHint}
        />
      </View>
    </SafeAreaView>
  );
}
