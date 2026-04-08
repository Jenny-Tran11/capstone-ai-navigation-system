import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import type { MainTabParamList } from "./types";
import { HomeScreen } from "../screens/HomeScreen";
import { NavigateScreen } from "../screens/NavigateScreen";
import { DetectScreen } from "../screens/DetectScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcon =
  (name: keyof typeof MaterialIcons.glyphMap) =>
  ({ color, size }: { color: string; size: number }) =>
    <MaterialIcons name={name} color={color} size={size} />;

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        tabBarShowLabel: true,
        tabBarLabelPosition: "below-icon",
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarAccessibilityLabel: "Home tab",
          tabBarIcon: tabIcon("home"),
        }}
      />
      <Tab.Screen
        name="Navigate"
        component={NavigateScreen}
        options={{
          title: "Navigate",
          tabBarLabel: "Navigate",
          tabBarAccessibilityLabel: "Navigate tab",
          tabBarIcon: tabIcon("directions-walk"),
        }}
      />
      <Tab.Screen
        name="Detect"
        component={DetectScreen}
        options={{
          title: "Detect",
          tabBarLabel: "Detect",
          tabBarAccessibilityLabel: "Detect tab",
          tabBarIcon: tabIcon("photo-camera"),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
          tabBarAccessibilityLabel: "Settings tab",
          tabBarIcon: tabIcon("settings"),
        }}
      />
    </Tab.Navigator>
  );
}
