import { Tabs } from 'expo-router';
import { Text } from 'react-native';

type TabIconProps = { color: string; label: string };
const TabIcon = ({ label }: TabIconProps) => <Text className="text-xs">{label}</Text>;

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
          tabBarIcon: (props) => <TabIcon {...props} label="🏠" />,
        }}
      />
      <Tabs.Screen
        name="navigate/index"
        options={{
          title: 'Navigate',
          tabBarIcon: (props) => <TabIcon {...props} label="🗺️" />,
        }}
      />
      <Tabs.Screen
        name="detect/index"
        options={{
          title: 'Detect',
          tabBarIcon: (props) => <TabIcon {...props} label="👁️" />,
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Settings',
          tabBarIcon: (props) => <TabIcon {...props} label="⚙️" />,
        }}
      />
    </Tabs>
  );
}
