import '@/lib/amplify';
import { confirmSignUp, resendSignUpCode } from '@aws-amplify/auth';
import { router, useLocalSearchParams } from 'expo-router';
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

export default function ConfirmSignUpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const handleConfirm = async () => {
    if (!code) {
      setError('Please enter the verification code.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await confirmSignUp({ username: email ?? '', confirmationCode: code });
      router.replace('/(auth)/sign-in');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Confirmation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResent(false);
    setError(null);
    try {
      await resendSignUpCode({ username: email ?? '' });
      setResent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center px-6"
      >
        <View className="mb-10">
          <Text className="text-4xl font-bold text-gray-900">Verify email</Text>
          <Text className="text-gray-500 mt-2 text-base">
            Enter the code sent to {email}
          </Text>
        </View>

        <View className="gap-4">
          <TextInput
            className="bg-gray-100 rounded-2xl px-4 py-4 text-base text-gray-900 tracking-widest"
            placeholder="6-digit code"
            placeholderTextColor="#94a3b8"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            accessibilityLabel="Verification code"
          />

          {error ? <Text className="text-red-500 text-sm">{error}</Text> : null}
          {resent ? (
            <Text className="text-green-600 text-sm">
              Code resent — check your inbox.
            </Text>
          ) : null}

          <Pressable
            onPress={handleConfirm}
            disabled={loading}
            className={`rounded-2xl py-4 items-center ${loading ? 'bg-blue-300' : 'bg-primary'}`}
            accessibilityRole="button"
            accessibilityLabel="Verify"
          >
            <Text className="text-white font-semibold text-lg">
              {loading ? 'Verifying…' : 'Verify'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleResend}
            disabled={resending}
            accessibilityRole="button"
            className="items-center mt-2"
          >
            <Text className="text-blue-600 text-sm">
              {resending ? 'Resending…' : 'Resend code'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
