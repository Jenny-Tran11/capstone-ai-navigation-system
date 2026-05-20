import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  clearApiDebugEntries,
  getApiDebugEntries,
  subscribeApiDebug,
} from '@/lib/api-debug-store';

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

export function ApiDebugOverlay({ enabled = false }: { enabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState(getApiDebugEntries());

  useEffect(() => {
    return subscribeApiDebug(() => {
      setEntries([...getApiDebugEntries()]);
    });
  }, []);

  if (!enabled) return null;

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel="Toggle API debug overlay"
      >
        <Text style={styles.fabText}>API {entries.length}</Text>
      </Pressable>

      {open ? (
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>API Debug</Text>
            <Pressable onPress={clearApiDebugEntries}>
              <Text style={styles.clear}>Clear</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={{ gap: 8 }}>
            {entries.slice(0, 80).map((e) => (
              <View key={e.id} style={styles.card}>
                <Text style={styles.line}>
                  [{fmtTime(e.ts)}] {e.client.toUpperCase()} {e.type.toUpperCase()}
                </Text>
                <Text style={styles.line}>
                  {e.method ?? 'GET'} {e.url}
                </Text>
                {typeof e.status === 'number' ? (
                  <Text style={styles.meta}>
                    status={e.status}
                    {typeof e.durationMs === 'number'
                      ? ` duration=${e.durationMs}ms`
                      : ''}
                  </Text>
                ) : null}
                {e.error ? <Text style={styles.err}>err={e.error}</Text> : null}
                {e.requestBody ? (
                  <Text style={styles.body} numberOfLines={4}>
                    req: {e.requestBody}
                  </Text>
                ) : null}
                {e.responseBody ? (
                  <Text style={styles.body} numberOfLines={6}>
                    res: {e.responseBody}
                  </Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    right: 12,
    bottom: 110,
    zIndex: 9999,
    alignItems: 'flex-end',
  },
  fab: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  fabText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  panel: {
    marginTop: 8,
    width: 360,
    maxWidth: '96%',
    maxHeight: 420,
    backgroundColor: '#030712',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  clear: {
    color: '#60a5fa',
    fontWeight: '600',
  },
  scroll: {
    maxHeight: 360,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 8,
    gap: 2,
  },
  line: {
    color: '#e5e7eb',
    fontSize: 11,
  },
  meta: {
    color: '#93c5fd',
    fontSize: 11,
  },
  err: {
    color: '#fca5a5',
    fontSize: 11,
  },
  body: {
    color: '#d1d5db',
    fontSize: 10,
  },
});
