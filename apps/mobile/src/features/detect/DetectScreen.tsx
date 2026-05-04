import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreferences } from '@/hooks/use-preferences';
import { useLiveDetection } from './use-live-detection';

export default function DetectScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [active, setActive] = useState(false);
  const { prefs } = usePreferences();

  const captureImage = async (): Promise<string | null> => {
    if (!cameraRef.current || !cameraReady) return null;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.3,
        skipProcessing: true,
        exif: false,
      });
      return photo?.base64 ?? null;
    } catch {
      return null;
    }
  };

  const { isRunning, lastDescription, errorCount } = useLiveDetection({
    intervalSec: prefs?.detectionIntervalSec ?? 10,
    maxScansPerHour: prefs?.maxScansPerHour ?? 30,
    hapticEnabled: prefs?.hapticEnabled ?? true,
    enabled: active && cameraReady,
    captureImage,
  });

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="white" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-900 p-6">
        <Text className="text-white text-xl font-semibold mb-4 text-center">
          Camera access required
        </Text>
        <Text className="text-gray-400 text-sm text-center mb-8">
          AI-Detect needs camera access to identify obstacles around you.
        </Text>
        <Pressable
          onPress={requestPermission}
          className="bg-primary px-8 py-4 rounded-2xl"
          accessibilityRole="button"
          accessibilityLabel="Grant camera access"
        >
          <Text className="text-white font-semibold text-lg">Grant access</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const paused = errorCount >= MAX_ERRORS_BEFORE_PAUSE;

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        className="flex-1"
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      />

      <View className="absolute inset-x-0 bottom-0 pb-12 px-6 items-center gap-4">
        {lastDescription ? (
          <View className="bg-black/70 rounded-2xl px-4 py-3 max-w-sm">
            <Text className="text-white text-base text-center">{lastDescription}</Text>
          </View>
        ) : null}

        {paused ? (
          <View className="bg-red-500/80 rounded-xl px-4 py-2">
            <Text className="text-white text-sm text-center">
              Detection paused — check API connection
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => {
            if (!paused) setActive((v) => !v);
          }}
          disabled={paused}
          className={[
            'w-20 h-20 rounded-full items-center justify-center',
            isRunning ? 'bg-red-500' : paused ? 'bg-gray-500' : 'bg-primary',
          ].join(' ')}
          accessibilityLabel={isRunning ? 'Stop detection' : 'Start detection'}
          accessibilityRole="button"
        >
          <Text className="text-white text-sm font-bold">
            {isRunning ? 'STOP' : paused ? 'ERROR' : 'START'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const MAX_ERRORS_BEFORE_PAUSE = 3;
