import '@/lib/amplify';
import { confirmResetPassword, resetPassword } from '@aws-amplify/auth';
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

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async () => {
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPassword({ username: email });
      setStep('confirm');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!code || !newPassword) {
      setError('Please enter the code and your new password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });
      router.replace('/(auth)/sign-in');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to reset password.');
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
            Reset password
          </Text>
          <Text className="text-gray-500 mt-2 text-base">
            {step === 'request'
              ? 'Enter your email to receive a reset code'
              : `Enter the code sent to ${email} and your new password`}
          </Text>
        </View>

        <View className="gap-4">
          {step === 'request' ? (
            <>
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
              {error ? (
                <Text className="text-red-500 text-sm">{error}</Text>
              ) : null}
              <Pressable
                onPress={handleRequest}
                disabled={loading}
                className={`rounded-2xl py-4 items-center ${loading ? 'bg-blue-300' : 'bg-primary'}`}
                accessibilityRole="button"
              >
                <Text className="text-white font-semibold text-lg">
                  {loading ? 'Sending…' : 'Send reset code'}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <TextInput
                className="bg-gray-100 rounded-2xl px-4 py-4 text-base text-gray-900 tracking-widest"
                placeholder="6-digit code"
                placeholderTextColor="#94a3b8"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                accessibilityLabel="Reset code"
              />
              <TextInput
                className="bg-gray-100 rounded-2xl px-4 py-4 text-base text-gray-900"
                placeholder="New password"
                placeholderTextColor="#94a3b8"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                accessibilityLabel="New password"
              />
              {error ? (
                <Text className="text-red-500 text-sm">{error}</Text>
              ) : null}
              <Pressable
                onPress={handleConfirm}
                disabled={loading}
                className={`rounded-2xl py-4 items-center ${loading ? 'bg-blue-300' : 'bg-primary'}`}
                accessibilityRole="button"
              >
                <Text className="text-white font-semibold text-lg">
                  {loading ? 'Resetting…' : 'Reset password'}
                </Text>
              </Pressable>
            </>
          )}

          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            className="items-center mt-2"
          >
            <Text className="text-blue-600 text-sm">Back to sign in</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
