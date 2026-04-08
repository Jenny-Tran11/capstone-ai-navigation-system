import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { MainTabs } from "./MainTabs";
import { useOnboarding } from "../context/OnboardingContext";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { completed } = useOnboarding();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {completed ? (
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ gestureEnabled: false }}
        />
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      )}
    </Stack.Navigator>
  );
}
