import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';

interface DetectionResult {
  name: string;
  confidence: number;
  box: [number, number, number, number];
}

interface DetectionRecord {
  detectionId: string;
  sceneDescription: string;
  detections: DetectionResult[];
  createdAt?: string;
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const fetcher = () =>
  apiClient.get<DetectionRecord[]>('/detection/user/my').then((r) => r.data);

function DetectionRow({ item }: { item: DetectionRecord }) {
  const [expanded, setExpanded] = useState(false);
  const names = item.detections
    .sort((a, b) => b.confidence - a.confidence)
    .map((d) => `${d.name} ${Math.round(d.confidence * 100)}%`)
    .join(', ');

  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      className="bg-white border border-gray-100 rounded-2xl p-4 gap-2"
      accessibilityRole="button"
      accessibilityLabel="Detection record"
    >
      <View className="flex-row justify-between items-start">
        <Text
          className="text-base font-semibold text-gray-900 flex-1 mr-2"
          numberOfLines={expanded ? undefined : 1}
        >
          {item.sceneDescription}
        </Text>
        <Text className="text-xs text-gray-400 shrink-0">
          {formatRelativeTime(item.createdAt)}
        </Text>
      </View>

      {expanded ? (
        <View className="mt-1 gap-1">
          {item.detections
            .sort((a, b) => b.confidence - a.confidence)
            .map((d, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: stable list
              <View key={i} className="flex-row justify-between">
                <Text className="text-sm text-gray-700">{d.name}</Text>
                <Text className="text-sm text-gray-500">
                  {Math.round(d.confidence * 100)}%
                </Text>
              </View>
            ))}
        </View>
      ) : (
        <Text className="text-sm text-gray-500" numberOfLines={1}>
          {names || 'No objects detected'}
        </Text>
      )}
    </Pressable>
  );
}

export default function HistoryScreen() {
  const { data, error, isLoading, mutate } = useSWR<DetectionRecord[]>(
    '/detection/user/my',
    fetcher,
  );
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await mutate();
    setRefreshing(false);
  }, [mutate]);

  const sorted = data
    ? [...data].sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      })
    : [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-6 pb-4 border-b border-gray-100 bg-white">
        <Text className="text-2xl font-bold text-gray-900">History</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-500 text-center">
            Could not load history. Make sure you are signed in and the API is
            running.
          </Text>
        </View>
      ) : sorted.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-400 text-center">
            No detections yet. Start a scan to see history here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.detectionId}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => <DetectionRow item={item} />}
        />
      )}
    </SafeAreaView>
  );
}
