import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
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

interface Section {
  title: string;
  data: DetectionRecord[];
}

function formatTime(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}

function dateKey(iso?: string): string {
  if (!iso) return 'unknown';
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dateLabel(iso?: string): string {
  if (!iso) return 'Unknown date';
  const d = new Date(iso);
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const k = dateKey(iso);
  if (k === todayKey) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;
  if (k === yKey) return 'Yesterday';
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

function groupByDate(records: DetectionRecord[]): Section[] {
  const seen = new Map<string, DetectionRecord[]>();
  for (const r of records) {
    const k = dateKey(r.createdAt);
    const group = seen.get(k) ?? [];
    group.push(r);
    seen.set(k, group);
  }
  return Array.from(seen.entries()).map(([, items]) => ({
    title: dateLabel(items[0].createdAt),
    data: items,
  }));
}

const fetcher = () =>
  apiClient.get<DetectionRecord[]>('/detection/user/my').then((r) => r.data);

function DetectionRow({ item }: { item: DetectionRecord }) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...item.detections].sort((a, b) => b.confidence - a.confidence);

  // Danger level badge
  const hasHighDanger = sorted.some((d) => d.confidence > 0.7);
  const badgeColor = hasHighDanger ? 'bg-red-100' : 'bg-blue-50';
  const badgeText = hasHighDanger ? 'text-red-700' : 'text-blue-700';
  const count = sorted.length;

  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      className="bg-white border border-gray-100 rounded-2xl p-4 gap-2"
      accessibilityRole="button"
      accessibilityLabel={`Detection at ${formatTime(item.createdAt)}: ${item.sceneDescription}`}
      accessibilityHint="Double-tap to expand detected objects"
    >
      <View className="flex-row justify-between items-start gap-2">
        <Text
          className="text-base font-semibold text-gray-900 flex-1"
          numberOfLines={expanded ? undefined : 2}
        >
          {item.sceneDescription}
        </Text>
        <Text className="text-xs text-gray-400 shrink-0 mt-0.5">
          {formatTime(item.createdAt)}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        <View className={`px-2 py-0.5 rounded-full ${badgeColor}`}>
          <Text className={`text-xs font-semibold ${badgeText}`}>
            {count} object{count !== 1 ? 's' : ''}
          </Text>
        </View>
        <Text className="text-xs text-gray-400">
          {expanded ? 'Tap to collapse' : 'Tap to expand'}
        </Text>
      </View>

      {expanded ? (
        <View className="mt-1 gap-1.5">
          {sorted.map((d, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: stable within this record
            <View key={i} className="flex-row justify-between items-center">
              <Text className="text-sm text-gray-700 capitalize">{d.name}</Text>
              <View className="flex-row items-center gap-2">
                <View
                  className="h-1.5 rounded-full bg-blue-200"
                  style={{ width: Math.round(d.confidence * 60) }}
                />
                <Text className="text-sm font-medium text-gray-600 w-9 text-right">
                  {Math.round(d.confidence * 100)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
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

  const sections = groupByDate(sorted);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-6 pb-4 border-b border-gray-100 bg-white">
        <Text className="text-2xl font-bold text-gray-900">History</Text>
        {sorted.length > 0 ? (
          <Text className="text-sm text-gray-500 mt-1">
            {sorted.length} detection{sorted.length !== 1 ? 's' : ''} recorded
          </Text>
        ) : null}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-2xl mb-3">⚠️</Text>
          <Text className="text-gray-700 font-semibold text-center mb-1">
            Could not load history
          </Text>
          <Text className="text-gray-400 text-sm text-center">
            Check your connection and try pulling down to refresh.
          </Text>
        </View>
      ) : sorted.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6 gap-3">
          <Text className="text-4xl">👁️</Text>
          <Text className="text-gray-700 font-semibold text-lg text-center">
            No detections yet
          </Text>
          <Text className="text-gray-400 text-sm text-center">
            When you scan for obstacles, each hazard detected is saved here so
            you can review what was around you.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.detectionId}
          contentContainerStyle={{ padding: 16, gap: 0 }}
          stickySectionHeadersEnabled
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderSectionHeader={({ section }) => (
            <View className="bg-gray-50 pb-2 pt-3">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View className="mb-2.5">
              <DetectionRow item={item} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
