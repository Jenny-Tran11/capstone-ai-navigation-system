import '@/lib/amplify';
import Slider from '@react-native-community/slider';
import { signOut } from '@aws-amplify/auth';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/lib/api-client';
import { usePreferences } from '@/hooks/use-preferences';

type RowProps = { label: string; value: string };
const InfoRow = ({ label, value }: RowProps) => (
  <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
    <Text className="text-base text-gray-700">{label}</Text>
    <Text className="text-base text-gray-900 font-medium">{value}</Text>
  </View>
);

const SYNC_LABEL: Record<string, string> = {
  local: 'Local only',
  syncing: 'Syncing…',
  synced: '✓ Synced',
  error: 'Sync error',
};
const SYNC_COLOR: Record<string, string> = {
  local: 'text-gray-400',
  syncing: 'text-gray-400',
  synced: 'text-green-600',
  error: 'text-red-500',
};

const TTS_LANGUAGES = [
  { label: 'English (AU)', value: 'en-AU' },
  { label: 'English (US)', value: 'en-US' },
  { label: 'English (UK)', value: 'en-GB' },
];

export default function SettingsScreen() {
  const { prefs, update, syncState } = usePreferences();
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    apiClient
      .get('/health', { timeout: 5000 })
      .then(() => setApiStatus('ok'))
      .catch(() => setApiStatus('error'));
  }, []);

  if (!prefs) return null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 pt-6 pb-4 border-b border-gray-100 flex-row justify-between items-end">
        <Text className="text-2xl font-bold text-gray-900">Settings</Text>
        <Text className={`text-xs ${SYNC_COLOR[syncState]}`}>{SYNC_LABEL[syncState]}</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, gap: 24 }}>
        {/* Voice */}
        <View>
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Voice</Text>
          <View className="bg-gray-50 rounded-2xl px-4">
            <View className="py-3 border-b border-gray-100">
              <Text className="text-base text-gray-700 mb-2">Speech rate: {prefs.speechRate.toFixed(1)}×</Text>
              <Slider
                minimumValue={0.5}
                maximumValue={2.0}
                step={0.1}
                value={prefs.speechRate}
                onSlidingComplete={(v) => update({ speechRate: Number(v.toFixed(1)) })}
                minimumTrackTintColor="#2563eb"
                accessibilityLabel="Speech rate"
              />
            </View>
            <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
              <Text className="text-base text-gray-700">Verbosity</Text>
              <View className="flex-row gap-2">
                {(['low', 'medium', 'high'] as const).map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => update({ verbosity: v })}
                    className={`px-3 py-1 rounded-xl ${prefs.verbosity === v ? 'bg-primary' : 'bg-gray-200'}`}
                  >
                    <Text className={`text-sm font-medium ${prefs.verbosity === v ? 'text-white' : 'text-gray-700'}`}>
                      {v}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View className="py-3">
              <Text className="text-base text-gray-700 mb-2">TTS language</Text>
              <View className="flex-row gap-2 flex-wrap">
                {TTS_LANGUAGES.map((lang) => (
                  <Pressable
                    key={lang.value}
                    onPress={() => update({ speechLanguage: lang.value })}
                    className={`px-3 py-1.5 rounded-xl ${prefs.speechLanguage === lang.value ? 'bg-primary' : 'bg-gray-200'}`}
                  >
                    <Text className={`text-sm font-medium ${prefs.speechLanguage === lang.value ? 'text-white' : 'text-gray-700'}`}>
                      {lang.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Detection */}
        <View>
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Detection</Text>
          <View className="bg-gray-50 rounded-2xl px-4">
            <View className="py-3 border-b border-gray-100">
              <Text className="text-base text-gray-700 mb-2">Interval: {prefs.detectionIntervalSec}s</Text>
              <Slider
                minimumValue={5}
                maximumValue={60}
                step={5}
                value={prefs.detectionIntervalSec}
                onSlidingComplete={(v) => update({ detectionIntervalSec: v })}
                minimumTrackTintColor="#2563eb"
                accessibilityLabel="Detection interval"
              />
            </View>
            <InfoRow label="Max scans / hour" value={String(prefs.maxScansPerHour)} />
          </View>
        </View>

        {/* Feedback */}
        <View>
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Feedback</Text>
          <View className="bg-gray-50 rounded-2xl px-4">
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-base text-gray-700">Haptic feedback</Text>
              <Switch
                value={prefs.hapticEnabled}
                onValueChange={(v) => update({ hapticEnabled: v })}
                trackColor={{ true: '#2563eb' }}
                accessibilityLabel="Toggle haptic feedback"
              />
            </View>
          </View>
        </View>

        {/* About */}
        <View>
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">About</Text>
          <View className="bg-gray-50 rounded-2xl px-4">
            <InfoRow label="App version" value={Constants.expoConfig?.version ?? '—'} />
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-base text-gray-700">API status</Text>
              <View className="flex-row items-center gap-2">
                <View
                  className={`w-2.5 h-2.5 rounded-full ${
                    apiStatus === 'ok' ? 'bg-green-500' : apiStatus === 'error' ? 'bg-red-500' : 'bg-gray-300'
                  }`}
                />
                <Text className="text-sm text-gray-500">
                  {apiStatus === 'ok' ? 'Connected' : apiStatus === 'error' ? 'Offline' : 'Checking…'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account */}
        <View>
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Account</Text>
          <Pressable
            onPress={async () => {
              await signOut();
              router.replace('/(auth)/sign-in');
            }}
            className="bg-red-50 rounded-2xl px-4 py-4 items-center"
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Text className="text-red-600 font-semibold text-base">Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
