import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ClockIcon,
  Cog6ToothIcon,
  EyeIcon,
  HomeIcon,
  MapIcon,
} from 'react-native-heroicons/outline';

const TAB_BAR_BASE_HEIGHT = 64;
const TAB_BAR_PADDING_BOTTOM = 8;

export default function TabsLayout() {
  const { bottom } = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          height: TAB_BAR_BASE_HEIGHT + bottom,
          paddingBottom: TAB_BAR_PADDING_BOTTOM + bottom,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history/index"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <ClockIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="detect/index"
        options={{
          title: 'Detect',
          tabBarIcon: ({ focused }) => (
            <View className="-mt-8 items-center">
              <View
                className={`h-[72px] w-[72px] rounded-full items-center justify-center border-4 border-white ${
                  focused ? 'bg-blue-700' : 'bg-blue-600'
                }`}
                style={{
                  shadowColor: '#1d4ed8',
                  shadowOpacity: 0.28,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 8,
                }}
              >
                <EyeIcon color="#ffffff" size={30} />
              </View>
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="navigate/index"
        options={{
          title: 'Navigate',
          tabBarIcon: ({ color, size }) => (
            <MapIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Cog6ToothIcon color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
