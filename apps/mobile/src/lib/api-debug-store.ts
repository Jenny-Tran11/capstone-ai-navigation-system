type ApiDebugEntry = {
  id: string;
  ts: number;
  type: 'request' | 'response' | 'error';
  client: 'axios' | 'fetch';
  method?: string;
  url: string;
  status?: number;
  durationMs?: number;
  requestBody?: string;
  responseBody?: string;
  error?: string;
};

const MAX_ENTRIES = 120;
const entries: ApiDebugEntry[] = [];
const listeners = new Set<() => void>();
let fetchPatched = false;

function safeStringify(value: unknown, maxLen = 1600): string {
  try {
    const raw =
      typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    return raw.length > maxLen ? `${raw.slice(0, maxLen)}…` : raw;
  } catch {
    return '[unserializable]';
  }
}

function emit(): void {
  for (const l of listeners) l();
}

export function addApiDebugEntry(
  entry: Omit<ApiDebugEntry, 'id' | 'ts'>,
): void {
  entries.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
    ...entry,
  });
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
  emit();
}

export function getApiDebugEntries(): ApiDebugEntry[] {
  return entries;
}

export function clearApiDebugEntries(): void {
  entries.length = 0;
  emit();
}

export function subscribeApiDebug(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function installGlobalFetchDebug(): void {
  if (fetchPatched || typeof globalThis.fetch !== 'function') return;
  fetchPatched = true;
  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method ?? 'GET').toUpperCase();
    const url = typeof input === 'string' ? input : String(input);
    const started = Date.now();
    addApiDebugEntry({
      type: 'request',
      client: 'fetch',
      method,
      url,
      requestBody: init?.body ? safeStringify(init.body) : undefined,
    });
    try {
      const res = await originalFetch(input, init);
      let body = '';
      try {
        body = await res.clone().text();
      } catch {
        body = '';
      }
      addApiDebugEntry({
        type: 'response',
        client: 'fetch',
        method,
        url,
        status: res.status,
        durationMs: Date.now() - started,
        responseBody: body ? safeStringify(body) : undefined,
      });
      return res;
    } catch (err) {
      addApiDebugEntry({
        type: 'error',
        client: 'fetch',
        method,
        url,
        durationMs: Date.now() - started,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }) as typeof fetch;
}

export { safeStringify };
