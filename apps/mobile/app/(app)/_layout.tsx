import { Redirect, Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ApiDebugOverlay } from '@/components/ApiDebugOverlay';
import { useIsAuthenticated } from '@/hooks/use-is-authenticated';
import { usePreferences } from '@/hooks/use-preferences';
import { installGlobalFetchDebug } from '@/lib/api-debug-store';
import { isOnboardingDone } from '@/lib/storage';

export default function AppLayout() {
  const isAuthenticated = useIsAuthenticated();
  const { prefs } = usePreferences();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments() as string[];

  useEffect(() => {
    installGlobalFetchDebug();
  }, []);

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

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <ApiDebugOverlay enabled={Boolean(prefs?.debugMode)} />
    </View>
  );
}
