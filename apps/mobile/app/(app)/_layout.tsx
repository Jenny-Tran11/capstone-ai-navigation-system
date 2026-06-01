import { Redirect, Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useIsAuthenticated } from '@/hooks/use-is-authenticated';
import { isOnboardingDone } from '@/lib/storage';

export default function AppLayout() {
  const isAuthenticated = useIsAuthenticated();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments() as string[];

  useEffect(() => {
    if (isAuthenticated !== true) {
      setOnboardingDone(null);
      return;
    }
    isOnboardingDone()
      .then(setOnboardingDone)
      .catch(() => setOnboardingDone(false));
  }, [isAuthenticated, segments]);

  useEffect(() => {
    if (isAuthenticated !== true || onboardingDone === null) return;
    const inOnboarding = segments[segments.length - 1] === 'onboarding';
    if (!onboardingDone && !inOnboarding) {
      router.replace('/(app)/onboarding' as never);
      return;
    }
    if (onboardingDone && inOnboarding) {
      router.replace('/(app)/(tabs)/home');
    }
  }, [isAuthenticated, onboardingDone, router, segments]);

  if (
    isAuthenticated === null ||
    (isAuthenticated === true && onboardingDone === null)
  ) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isAuthenticated === false) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
