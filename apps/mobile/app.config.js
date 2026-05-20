/** @type {import('@expo/config').ExpoConfig} */
module.exports = {
  name: 'AI-Detect',
  slug: 'ai-detect',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  scheme: 'aidetect',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.aidetect.app',
    infoPlist: {
      NSCameraUsageDescription: 'Used for real-time obstacle detection.',
      NSLocationWhenInUseUsageDescription: 'Used for turn-by-turn navigation.',
      NSMicrophoneUsageDescription: 'Used for voice assistant during navigation.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.aidetect.app',
    permissions: [
      'android.permission.CAMERA',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.VIBRATE',
      'android.permission.RECORD_AUDIO',
    ],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-camera',
    'expo-location',
    [
      'expo-av',
      {
        microphonePermission: 'Used for voice assistant during navigation.',
      },
    ],
    'react-native-fast-tflite',
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
        iosGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: '631aa52f-c308-45db-ae64-2e4f43d1be40',
    },
  },
  owner: 'capstoneuow',
};
