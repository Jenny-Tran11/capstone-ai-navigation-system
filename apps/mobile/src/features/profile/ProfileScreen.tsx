import '@/lib/amplify';
import { fetchUserAttributes, signOut } from '@aws-amplify/auth';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from './use-profile';

export default function ProfileScreen() {
  const { profile, loading, update } = useProfile();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await update({ displayName });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 pt-6 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Profile</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <View className="flex-1 px-5 pt-6 gap-6">
          <View className="bg-gray-50 rounded-2xl px-4 py-4 gap-4">
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
                  setSaved(false);
                }}
                accessibilityLabel="Display name"
              />
            </View>

            {saved ? (
              <Text className="text-green-600 text-sm">Saved!</Text>
            ) : null}

            <Pressable
              onPress={handleSave}
              disabled={saving}
              className={`rounded-xl py-3 items-center ${saving ? 'bg-blue-300' : 'bg-primary'}`}
              accessibilityRole="button"
              accessibilityLabel="Save profile"
            >
              <Text className="text-white font-semibold">
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </Pressable>
          </View>

          <View className="bg-gray-50 rounded-2xl px-4 py-4">
            <Text className="text-xs text-gray-500 mb-1">App version</Text>
            <Text className="text-base text-gray-900">
              {Constants.expoConfig?.version ?? '—'}
            </Text>
          </View>

          <Pressable
            onPress={handleSignOut}
            className="bg-red-50 rounded-2xl px-4 py-4 items-center"
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Text className="text-red-600 font-semibold text-base">
              Sign out
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
