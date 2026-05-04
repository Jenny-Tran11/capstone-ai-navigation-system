import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // TODO: replace with real Cognito sign-in
      // await signIn({ username: email, password });
      router.replace('/(app)/(tabs)/home');
    } catch (_e) {
      setError('Sign in failed. Check your credentials.');
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
          <Text className="text-gray-500 mt-2 text-base">Sign in to continue</Text>
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
