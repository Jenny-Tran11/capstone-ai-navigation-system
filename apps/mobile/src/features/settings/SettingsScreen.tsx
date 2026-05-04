import Slider from '@react-native-community/slider';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreferences } from '@/hooks/use-preferences';

type RowProps = { label: string; value: string };
const InfoRow = ({ label, value }: RowProps) => (
  <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
    <Text className="text-base text-gray-700">{label}</Text>
    <Text className="text-base text-gray-900 font-medium">{value}</Text>
  </View>
);

export default function SettingsScreen() {
  const { prefs, update } = usePreferences();

  if (!prefs) return null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 pt-6 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Settings</Text>
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
            <View className="flex-row justify-between items-center py-3">
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
          </View>
        </View>

        {/* Detection */}
        <View>
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Detection</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}
