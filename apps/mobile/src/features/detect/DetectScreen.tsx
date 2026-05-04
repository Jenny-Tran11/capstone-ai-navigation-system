import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreferences } from '@/hooks/use-preferences';
import { useLiveDetection } from './use-live-detection';

export default function DetectScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [active, setActive] = useState(false);
  const { prefs } = usePreferences();

  const captureImage = async (): Promise<string | null> => {
    if (!cameraRef.current) return null;
    const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
    return photo?.base64 ?? null;
  };

  const { isRunning, lastDescription, errorCount } = useLiveDetection({
    intervalSec: prefs?.detectionIntervalSec ?? 10,
    maxScansPerHour: prefs?.maxScansPerHour ?? 30,
    enabled: active,
    captureImage,
  });

  if (!permission) return <ActivityIndicator className="flex-1" />;

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-900 p-6">
        <Text className="text-white text-xl font-semibold mb-4 text-center">Camera access required</Text>
        <Text className="text-gray-400 text-sm text-center mb-8">
          AI-Detect needs camera access to identify obstacles.
        </Text>
        <Pressable
          onPress={requestPermission}
          className="bg-primary px-8 py-4 rounded-2xl"
        >
          <Text className="text-white font-semibold text-lg">Grant access</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView ref={cameraRef} className="flex-1" facing="back" />

      {/* Overlay */}
      <View className="absolute inset-x-0 bottom-0 pb-12 px-6 items-center gap-4">
        {lastDescription ? (
          <View className="bg-black/70 rounded-2xl px-4 py-3 max-w-sm">
            <Text className="text-white text-base text-center">{lastDescription}</Text>
          </View>
        ) : null}

        {errorCount >= 3 ? (
          <View className="bg-red-500/80 rounded-xl px-4 py-2">
            <Text className="text-white text-sm">Detection paused — check API connection</Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => setActive((v) => !v)}
          className={`w-20 h-20 rounded-full items-center justify-center ${isRunning ? 'bg-red-500' : 'bg-primary'}`}
          accessibilityLabel={isRunning ? 'Stop detection' : 'Start detection'}
          accessibilityRole="button"
        >
          <Text className="text-white text-sm font-bold">{isRunning ? 'STOP' : 'START'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
