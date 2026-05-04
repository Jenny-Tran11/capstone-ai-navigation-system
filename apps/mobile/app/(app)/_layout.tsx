import { Redirect, Stack } from 'expo-router';
import { useIsAuthenticated } from '@/hooks/use-is-authenticated';

export default function AppLayout() {
  const isAuthenticated = useIsAuthenticated();

  if (isAuthenticated === false) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
