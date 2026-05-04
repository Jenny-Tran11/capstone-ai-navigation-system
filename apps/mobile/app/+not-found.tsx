import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-2xl font-bold text-gray-900 mb-2">Page not found</Text>
        <Link href="/" className="text-primary mt-4">
          Go home
        </Link>
      </View>
    </>
  );
}
