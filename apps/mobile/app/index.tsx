import { Redirect } from 'expo-router';

export default function Index() {
  // Top-level redirect — auth guard lives in (app)/_layout.tsx
  return <Redirect href="/(app)/(tabs)/home" />;
}
