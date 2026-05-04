import { Tabs } from 'expo-router';
import { Cog6ToothIcon, EyeIcon, HomeIcon, MapIcon } from 'react-native-heroicons/outline';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { paddingBottom: 4 },
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="navigate/index"
        options={{
          title: 'Navigate',
          tabBarIcon: ({ color, size }) => <MapIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="detect/index"
        options={{
          title: 'Detect',
          tabBarIcon: ({ color, size }) => <EyeIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Cog6ToothIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
