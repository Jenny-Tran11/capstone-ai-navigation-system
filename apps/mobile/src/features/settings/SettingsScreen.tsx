import '@/lib/amplify';
import { fetchUserAttributes, signOut } from '@aws-amplify/auth';
import Slider from '@react-native-community/slider';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/features/profile/use-profile';
import { usePreferences } from '@/hooks/use-preferences';
import { apiClient } from '@/lib/api-client';
import {
  clearRuntimeConfigCache,
  getRuntimeConfig,
  type MobileRuntimeConfig,
} from '@/lib/runtime-config';

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
  const {
    profile,
    loading: profileLoading,
    update: updateProfile,
  } = useProfile();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [contactSaved, setContactSaved] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>(
    'checking',
  );
  const [runtimeConfig, setRuntimeConfig] = useState<MobileRuntimeConfig | null>(
    null,
  );
  const [runtimeLoading, setRuntimeLoading] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserAttributes()
      .then((attrs) => setEmail(attrs.email ?? ''))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (profile?.displayName !== undefined) {
      setDisplayName(profile.displayName ?? '');
    }
  }, [profile?.displayName]);

  useEffect(() => {
    apiClient
      .get('/health', { timeout: 5000 })
      .then(() => setApiStatus('ok'))
      .catch(() => setApiStatus('error'));
  }, []);

  useEffect(() => {
    setEmergencyName(prefs?.emergencyContact?.name ?? '');
    setEmergencyPhone(prefs?.emergencyContact?.phone ?? '');
  }, [prefs?.emergencyContact?.name, prefs?.emergencyContact?.phone]);

  const loadRuntimeDebug = async () => {
    setRuntimeLoading(true);
    setRuntimeError(null);
    try {
      clearRuntimeConfigCache();
      const cfg = await getRuntimeConfig();
      setRuntimeConfig(cfg);
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : 'Failed to load');
    } finally {
      setRuntimeLoading(false);
    }
  };

  useEffect(() => {
    void loadRuntimeDebug();
  }, []);

  if (!prefs) return null;

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileSaved(false);
    try {
      await updateProfile({ displayName });
      setProfileSaved(true);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveEmergencyContact = async () => {
    await update({
      emergencyContact: {
        name: emergencyName.trim(),
        phone: emergencyPhone.trim(),
      },
    });
    setContactSaved(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 pt-6 pb-4 border-b border-gray-100 flex-row justify-between items-end">
        <Text className="text-2xl font-bold text-gray-900">Settings</Text>
        <Text className={`text-xs ${SYNC_COLOR[syncState]}`}>
          {SYNC_LABEL[syncState]}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, gap: 24 }}
      >
        {/* Profile */}
        <View>
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Profile
          </Text>
          <View className="bg-gray-50 rounded-2xl px-4 py-4 gap-4">
            {profileLoading ? (
              <View className="py-2 items-center">
                <ActivityIndicator size="small" color="#2563eb" />
              </View>
            ) : null}

            <View>
              <Text className="text-xs text-gray-500 mb-1">Email</Text>
              <Text className="text-base text-gray-900">{email || '—'}</Text>
            </View>

            <View>
              <Text className="text-xs text-gray-500 mb-1">Display name</Text>
              <TextInput
                className="bg-white rounded-xl px-3 py-3 text-base text-gray-900 border border-gray-200"
                placeholder="Your name"
                placeholderTextColor="#94a3b8"
                value={displayName}
                onChangeText={(v) => {
                  setDisplayName(v);
                  setProfileSaved(false);
                }}
                accessibilityLabel="Display name"
              />
            </View>

            {profileSaved ? (
              <Text className="text-green-600 text-sm">Profile saved!</Text>
            ) : null}

            <Pressable
              onPress={() => void handleSaveProfile()}
              disabled={savingProfile}
              className={`rounded-xl py-3 items-center ${savingProfile ? 'bg-blue-300' : 'bg-primary'}`}
              accessibilityRole="button"
              accessibilityLabel="Save profile"
            >
              <Text className="text-white font-semibold">
                {savingProfile ? 'Saving…' : 'Save profile'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Emergency Contact */}
        <View>
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Emergency Contact
          </Text>
          <View className="bg-gray-50 rounded-2xl px-4 py-4 gap-4">
            <View>
              <Text className="text-xs text-gray-500 mb-1">Name</Text>
              <TextInput
                className="bg-white rounded-xl px-3 py-3 text-base text-gray-900 border border-gray-200"
                placeholder="Emergency contact name"
                placeholderTextColor="#94a3b8"
                value={emergencyName}
                onChangeText={(v) => {
                  setEmergencyName(v);
                  setContactSaved(false);
                }}
                accessibilityLabel="Emergency contact name"
              />
            </View>

            <View>
              <Text className="text-xs text-gray-500 mb-1">Phone</Text>
              <TextInput
                className="bg-white rounded-xl px-3 py-3 text-base text-gray-900 border border-gray-200"
                placeholder="+61..."
                placeholderTextColor="#94a3b8"
                value={emergencyPhone}
                onChangeText={(v) => {
                  setEmergencyPhone(v);
                  setContactSaved(false);
                }}
                keyboardType="phone-pad"
                accessibilityLabel="Emergency contact phone"
              />
            </View>

            {contactSaved ? (
              <Text className="text-green-600 text-sm">
                Emergency contact saved!
              </Text>
            ) : null}

            <Pressable
              onPress={() => void handleSaveEmergencyContact()}
              className="rounded-xl py-3 items-center bg-primary"
              accessibilityRole="button"
              accessibilityLabel="Save emergency contact"
            >
              <Text className="text-white font-semibold">
                Save emergency contact
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Voice */}
        <View>
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Voice
          </Text>
          <View className="bg-gray-50 rounded-2xl px-4">
            <View className="py-3 border-b border-gray-100">
              <Text className="text-base text-gray-700 mb-2">
                Speech rate: {prefs.speechRate.toFixed(1)}×
              </Text>
              <Slider
                minimumValue={0.5}
                maximumValue={2.0}
                step={0.1}
                value={prefs.speechRate}
                onSlidingComplete={(v) =>
                  update({ speechRate: Number(v.toFixed(1)) })
                }
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
                    <Text
                      className={`text-sm font-medium ${prefs.verbosity === v ? 'text-white' : 'text-gray-700'}`}
                    >
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
                    <Text
                      className={`text-sm font-medium ${prefs.speechLanguage === lang.value ? 'text-white' : 'text-gray-700'}`}
                    >
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
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Detection
          </Text>
          <View className="bg-gray-50 rounded-2xl px-4">
            <View className="py-3 border-b border-gray-100">
              <Text className="text-base text-gray-700 mb-2">
                Interval: {prefs.detectionIntervalSec}s
              </Text>
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
            <InfoRow
              label="Max scans / hour"
              value={String(prefs.maxScansPerHour)}
            />
          </View>
        </View>

        {/* Feedback */}
        <View>
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Feedback
          </Text>
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
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            About
          </Text>
          <View className="bg-gray-50 rounded-2xl px-4">
            <InfoRow
              label="App version"
              value={Constants.expoConfig?.version ?? '—'}
            />
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-base text-gray-700">API status</Text>
              <View className="flex-row items-center gap-2">
                <View
                  className={`w-2.5 h-2.5 rounded-full ${
                    apiStatus === 'ok'
                      ? 'bg-green-500'
                      : apiStatus === 'error'
                        ? 'bg-red-500'
                        : 'bg-gray-300'
                  }`}
                />
                <Text className="text-sm text-gray-500">
                  {apiStatus === 'ok'
                    ? 'Connected'
                    : apiStatus === 'error'
                      ? 'Offline'
                      : 'Checking…'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Runtime Debug */}
        <View>
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Runtime Debug
          </Text>
          <View className="bg-gray-50 rounded-2xl px-4 py-4 gap-2">
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-base text-gray-700">Debug mode</Text>
              <Switch
                value={Boolean(prefs.debugMode)}
                onValueChange={(v) => update({ debugMode: v })}
                trackColor={{ true: '#2563eb' }}
                accessibilityLabel="Toggle debug mode"
              />
            </View>
            <InfoRow
              label="API base URL"
              value={String(apiClient.defaults.baseURL ?? '—')}
            />
            <InfoRow
              label="ENV detect URL"
              value={process.env.EXPO_PUBLIC_DETECT_API_URL ?? '—'}
            />
            <InfoRow
              label="ENV crossing URL"
              value={process.env.EXPO_PUBLIC_CROSSING_API_URL ?? '—'}
            />
            <InfoRow
              label="ENV maps key"
              value={
                process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
                  ? `set (${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.length} chars)`
                  : 'empty'
              }
            />
            <InfoRow
              label="Runtime detect URL"
              value={runtimeConfig?.detectApiBaseUrl ?? '—'}
            />
            <InfoRow
              label="Runtime crossing URL"
              value={runtimeConfig?.crossingApiBaseUrl ?? '—'}
            />
            <InfoRow
              label="Runtime maps key"
              value={
                runtimeConfig?.googleMapsApiKey
                  ? `set (${runtimeConfig.googleMapsApiKey.length} chars)`
                  : 'empty'
              }
            />

            {runtimeError ? (
              <Text className="text-xs text-red-500">Error: {runtimeError}</Text>
            ) : null}

            <Pressable
              onPress={() => void loadRuntimeDebug()}
              disabled={runtimeLoading}
              className={`rounded-xl py-3 items-center ${runtimeLoading ? 'bg-blue-300' : 'bg-primary'}`}
              accessibilityRole="button"
              accessibilityLabel="Refresh runtime debug"
            >
              <Text className="text-white font-semibold">
                {runtimeLoading ? 'Refreshing…' : 'Refresh runtime debug'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Account */}
        <View>
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Account
          </Text>
          <Pressable
            onPress={async () => {
              await signOut();
              router.replace('/(auth)/sign-in');
            }}
            className="bg-red-50 rounded-2xl px-4 py-4 items-center"
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Text className="text-red-600 font-semibold text-base">
              Sign out
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
