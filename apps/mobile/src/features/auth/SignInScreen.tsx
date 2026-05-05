import { signIn } from '@aws-amplify/auth';
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
import { configureAmplify } from '@/lib/amplify';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userPoolId = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID || 'not set';
  const clientId = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID || 'not set';
  const cognitoEndpoint = process.env.EXPO_PUBLIC_COGNITO_ENDPOINT || 'not set';

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      configureAmplify();
      const { nextStep } = await signIn({
        username: email,
        password,
        options: { authFlowType: 'USER_PASSWORD_AUTH' },
      });
      if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        router.replace({
          pathname: '/(auth)/confirm-signup',
          params: { email },
        });
      } else {
        router.replace('/(app)/(tabs)/home');
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : 'Sign in failed. Check your credentials.';
      setError(msg);
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
          <Text className="text-4xl font-bold text-gray-900">AI-Detect</Text>
          <Text className="text-gray-500 mt-2 text-base">
            Sign in to continue
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

          {error ? <Text className="text-red-500 text-sm">{error}</Text> : null}

          <Pressable
            onPress={handleSignIn}
            disabled={loading}
            className={`rounded-2xl py-4 items-center ${loading ? 'bg-blue-300' : 'bg-primary'}`}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            <Text className="text-white font-semibold text-lg">
              {loading ? 'Signing in…' : 'Sign in'}
            </Text>
          </Pressable>

          <View className="flex-row justify-between mt-2">
            <Pressable
              onPress={() => router.push('/(auth)/sign-up')}
              accessibilityRole="button"
            >
              <Text className="text-blue-600 text-sm">Create account</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(auth)/forgot-password')}
              accessibilityRole="button"
            >
              <Text className="text-blue-600 text-sm">Forgot password?</Text>
            </Pressable>
          </View>

          {__DEV__ ? (
            <View className="mt-6 rounded-2xl bg-gray-50 p-3">
              <Text className="text-xs font-semibold text-gray-700">
                Cognito config
              </Text>
              <Text className="mt-1 text-xs text-gray-500">
                User pool: {userPoolId}
              </Text>
              <Text className="text-xs text-gray-500">Client: {clientId}</Text>
              <Text className="text-xs text-gray-500">
                Endpoint: {cognitoEndpoint}
              </Text>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
