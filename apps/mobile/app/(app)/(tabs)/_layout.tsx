import { Tabs } from 'expo-router';
import { View } from 'react-native';
import {
  ClockIcon,
  Cog6ToothIcon,
  EyeIcon,
  HomeIcon,
  MapIcon,
} from 'react-native-heroicons/outline';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { paddingBottom: 8, height: 72 },
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
