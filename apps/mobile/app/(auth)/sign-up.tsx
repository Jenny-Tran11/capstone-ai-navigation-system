import '@/lib/amplify';
import { signUp } from '@aws-amplify/auth';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!email || !password || !confirm) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signUp({
        username: email,
        password,
        options: { userAttributes: { email } },
      });
      router.replace({ pathname: '/(auth)/confirm-signup', params: { email } });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center px-6"
      >
        <View className="mb-10">
          <Text className="text-4xl font-bold text-gray-900">
            Create account
          </Text>
          <Text className="text-gray-500 mt-2 text-base">
            Sign up to get started
          </Text>
        </View>

        <View className="gap-4">
          <TextInput
            className="bg-gray-100 rounded-2xl px-4 py-4 text-base text-gray-900"
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            accessibilityLabel="Email address"
          />
          <TextInput
            className="bg-gray-100 rounded-2xl px-4 py-4 text-base text-gray-900"
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            accessibilityLabel="Password"
          />
          <TextInput
            className="bg-gray-100 rounded-2xl px-4 py-4 text-base text-gray-900"
            placeholder="Confirm password"
            placeholderTextColor="#94a3b8"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            accessibilityLabel="Confirm password"
          />

          {error ? <Text className="text-red-500 text-sm">{error}</Text> : null}

          <Pressable
            onPress={handleSignUp}
            disabled={loading}
            className={`rounded-2xl py-4 items-center ${loading ? 'bg-blue-300' : 'bg-primary'}`}
            accessibilityRole="button"
            accessibilityLabel="Create account"
          >
            <Text className="text-white font-semibold text-lg">
              {loading ? 'Creating account…' : 'Create account'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            className="items-center mt-2"
          >
            <Text className="text-blue-600 text-sm">
              Already have an account? Sign in
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
