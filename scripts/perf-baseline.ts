#!/usr/bin/env tsx
/**
 * Performance baseline — AI navigation system
 *
 * Measures and writes baselines/perf-<timestamp>.json
 *
 * Measurements:
 *   1. Model cold-start  — container stop → first successful /health (ms)
 *   2. Warm /health      — median + P95 over N sequential calls
 *   3. Detection latency — P50 + P95 over N samples (20 default)
 *   4. API process       — CPU% + RSS sampled throughout the detection run
 *   5. Model container   — CPU% + memory sampled throughout the detection run
 *
 * Usage:
 *   pnpm exec tsx scripts/perf-baseline.ts
 *   pnpm exec tsx scripts/perf-baseline.ts --skip-cold-start
 *   pnpm exec tsx scripts/perf-baseline.ts --detection-samples 50
 *   pnpm exec tsx scripts/perf-baseline.ts --health-samples 20
 *   pnpm exec tsx scripts/perf-baseline.ts --out baselines/my-run.json
 *
 * Env overrides:
 *   PERF_API_URL    (default: http://localhost:4000)
 *   PERF_MODEL_URL  (default: http://localhost:8080)
 */

import * as fs   from 'node:fs';
import * as os   from 'node:os';
import * as path from 'node:path';
import { execSync, spawn }  from 'node:child_process';
import { performance }           from 'node:perf_hooks';

// ── Config ────────────────────────────────────────────────────────────────────

const API_URL   = process.env.PERF_API_URL   ?? 'http://localhost:4000';
const MODEL_URL = process.env.PERF_MODEL_URL ?? 'http://localhost:8080';
// process.argv[1] is the script path; go up two levels (scripts/ → repo root)
const REPO_ROOT = path.resolve(process.argv[1] ?? process.cwd(), '..', '..');

const argv = process.argv.slice(2);
const flag = (name: string, fallback: number) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? parseInt(argv[i + 1], 10) || fallback : fallback;
};

const DETECTION_SAMPLES  = flag('--detection-samples', 20);
const HEALTH_SAMPLES     = flag('--health-samples', 10);
const SKIP_COLD_START    = argv.includes('--skip-cold-start');
const COLD_START_TIMEOUT = 120_000; // ms — YOLO weights can take ~60 s to load
const HTTP_TIMEOUT_MS    = 15_000;

const outArgIdx = argv.indexOf('--out');
const OUT_FILE  =
  outArgIdx >= 0 && argv[outArgIdx + 1]
    ? path.resolve(argv[outArgIdx + 1])
    : path.join(
        REPO_ROOT,
        'baselines',
        `perf-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
      );

// ── Terminal colours ──────────────────────────────────────────────────────────

const tty = process.stdout.isTTY && process.env.NO_COLOR !== '1';
const c = (n: number, s: string) => (tty ? `\x1b[${n}m${s}\x1b[0m` : s);
const green  = (s: string) => c(32, s);
const yellow = (s: string) => c(33, s);
const cyan   = (s: string) => c(36, s);
const bold   = (s: string) => c(1,  s);
const dim    = (s: string) => c(2,  s);

const hr = (ch = '─', n = 60) => ch.repeat(n);

function section(title: string) {
  console.log(`\n${bold(hr())}`);
  console.log(bold(` ${title}`));
  console.log(bold(hr()));
}

function note(msg: string) { console.log(dim(`  ${msg}`)); }
function info(msg: string) { console.log(cyan('  ●') + ' ' + msg); }
function done(msg: string) { console.log(green('  ✓') + ' ' + msg); }
function warn(msg: string) { console.log(yellow('  ⚠') + ' ' + msg); }

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Node.js wraps ECONNREFUSED inside err.cause (AggregateError) — dig it out. */
function errMsg(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const cause = (err as { cause?: unknown }).cause;
  const inner =
    cause instanceof AggregateError ? (cause.errors?.[0] ?? cause) :
    cause instanceof Error          ? cause : null;
  const causeMsg = inner instanceof Error ? inner.message : '';
  return causeMsg && causeMsg !== err.message
    ? `${err.message} — ${causeMsg}`
    : err.message;
}

// ── Statistics ────────────────────────────────────────────────────────────────

function pct(samples: number[], p: number): number {
  const arr = [...samples].sort((a, b) => a - b);
  const n   = arr.length;
  if (n === 0) return 0;
  const pos  = (p / 100) * (n - 1);
  const lo   = Math.floor(pos);
  const hi   = Math.ceil(pos);
  const val  = lo === hi ? arr[lo] : arr[lo] + (arr[hi] - arr[lo]) * (pos - lo);
  return round2(val);
}

function round2(v: number)  { return Math.round(v * 100) / 100; }
function round1(v: number)  { return Math.round(v * 10)  / 10;  }
function roundInt(v: number){ return Math.round(v); }

function stats(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    min:  round2(sorted[0]  ?? 0),
    max:  round2(sorted[sorted.length - 1] ?? 0),
    mean: round2(samples.reduce((s, v) => s + v, 0) / (samples.length || 1)),
    p50:  pct(samples, 50),
    p95:  pct(samples, 95),
  };
}

// ── Docker ────────────────────────────────────────────────────────────────────

function dockerContainerOnPort(port: number): string | undefined {
  try {
    const out = execSync(
      `docker ps --filter "publish=${port}" --format "{{.Names}}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
    ).trim();
    return out.split('\n')[0]?.trim() || undefined;
  } catch { return undefined; }
}

interface DockerSample { cpuPercent: number; memMb: number; ts: number }

/** Non-blocking: spawns `docker stats --no-stream` as a child process. */
function sampleDockerStats(containerName: string): Promise<DockerSample | null> {
  return new Promise((resolve) => {
    let stdout = '';
    const proc = spawn('docker', [
      'stats', '--no-stream', '--format', '{{.CPUPerc}}\t{{.MemUsage}}', containerName,
    ]);
    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    proc.on('close', () => {
      const [cpuStr = '', memStr = ''] = stdout.trim().split('\t');
      const cpu   = parseFloat(cpuStr.replace('%', '')) || 0;
      const memMb = parseDockerMem(memStr);
      resolve(cpu === 0 && memMb === 0 ? null : { cpuPercent: round2(cpu), memMb: round2(memMb), ts: Date.now() });
    });
    proc.on('error', () => resolve(null));
    const timer = setTimeout(() => { proc.kill(); resolve(null); }, 5_000);
    proc.on('close', () => clearTimeout(timer));
  });
}

function parseDockerMem(str: string): number {
  const used  = str.split('/')[0]?.trim() ?? '';
  const value = parseFloat(used) || 0;
  const unit  = used.replace(/[\d.\s]/g, '').toLowerCase();
  if (unit.startsWith('g')) return value * 1024;
  if (unit.startsWith('m')) return value;
  if (unit.startsWith('k')) return value / 1024;
  return value;
}

// ── OS process sampling (API server, macOS + Linux) ──────────────────────────

interface ProcessSample { cpuPercent: number; rssKb: number; ts: number }

function getApiPid(): number | null {
  try {
    const out = execSync('lsof -ti :4000', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    const pid = parseInt(out.split('\n')[0] ?? '', 10);
    return Number.isFinite(pid) && pid > 0 ? pid : null;
  } catch { return null; }
}

function sampleProcess(pid: number): ProcessSample | null {
  try {
    // -o: field list; trailing = suppresses headers
    const out = execSync(`ps -p ${pid} -o pid=,pcpu=,rss=`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 2_000,
    }).trim();
    const parts = out.split(/\s+/);
    const cpu   = parseFloat(parts[1] ?? '0') || 0;
    const rss   = parseInt(parts[2] ?? '0', 10) || 0;
    return { cpuPercent: round2(cpu), rssKb: rss, ts: Date.now() };
  } catch { return null; }
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function timedGet(url: string): Promise<{ ms: number; ok: boolean; status: number }> {
  const t0  = performance.now();
  const res = await fetch(url, { signal: AbortSignal.timeout(HTTP_TIMEOUT_MS) });
  await res.body?.cancel();
  return { ms: round2(performance.now() - t0), ok: res.ok, status: res.status };
}

async function timedPost(
  url: string,
  body: unknown,
): Promise<{ ms: number; ok: boolean; status: number; body: unknown }> {
  const t0  = performance.now();
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });
  const ms   = round2(performance.now() - t0);
  const text = await res.text();
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { parsed = text; }
  return { ms, ok: res.ok, status: res.status, body: parsed };
}

// 1×1 white PNG — adequate for model throughput testing (tiny payload, valid image)
const TINY_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';

// ── Measurement functions ─────────────────────────────────────────────────────

// ── 1. Cold start ─────────────────────────────────────────────────────────────

interface ColdStartResult {
  skipped:        boolean;
  skipReason?:    string;
  ms?:            number;
  containerName?: string;
  modelLoaded?:   boolean;
}

async function measureColdStart(container: string): Promise<ColdStartResult> {
  info(`Stopping container: ${container}`);
  execSync(`docker stop ${container}`, { stdio: 'pipe' });
  await sleep(500);

  info('Restarting and timing to first /health response…');
  const t0 = performance.now();
  execSync(`docker start ${container}`, { stdio: 'pipe' });

  const deadline = Date.now() + COLD_START_TIMEOUT;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${MODEL_URL}/health`, {
        signal: AbortSignal.timeout(2_000),
      });
      if (res.ok) {
        const ms   = round2(performance.now() - t0);
        const body = (await res.json()) as { model_loaded?: boolean };
        done(`Cold start: ${ms} ms  model_loaded=${body.model_loaded}`);
        return { skipped: false, ms, containerName: container, modelLoaded: body.model_loaded };
      }
    } catch { /* not ready */ }
    await sleep(200);
  }
  throw new Error(`Container did not become healthy within ${COLD_START_TIMEOUT / 1000} s`);
}

// ── 2. Warm /health latency ───────────────────────────────────────────────────

interface HealthResult {
  samples: number;
  p50Ms:   number;
  p95Ms:   number;
  minMs:   number;
  maxMs:   number;
  meanMs:  number;
  rawMs:   number[];
}

async function measureHealthLatency(n: number): Promise<HealthResult> {
  const raw: number[] = [];
  for (let i = 0; i < n; i++) {
    const { ms } = await timedGet(`${MODEL_URL}/health`);
    raw.push(ms);
    process.stdout.write(dim(`  /health [${i + 1}/${n}] ${ms}ms\r`));
    if (i < n - 1) await sleep(50); // brief gap — avoid queuing effects
  }
  process.stdout.write('\n');
  const s = stats(raw);
  done(`Warm /health  p50=${s.p50}ms  p95=${s.p95}ms  min=${s.min}ms  max=${s.max}ms`);
  return { samples: n, p50Ms: s.p50, p95Ms: s.p95, minMs: s.min, maxMs: s.max, meanMs: s.mean, rawMs: raw };
}

// ── 3+4. Detection latency + concurrent resource sampling ────────────────────

interface DetectionResult {
  samples:     number;
  modelLoaded: boolean;
  p50Ms:       number;
  p95Ms:       number;
  minMs:       number;
  maxMs:       number;
  meanMs:      number;
  rawMs:       number[];
}

interface ResourceResult {
  apiProcess: {
    pid:             number | null;
    available:       boolean;
    baselineRssKb:   number;
    peakRssKb:       number;
    minRssKb:        number;
    meanRssKb:       number;
    baselineCpuPct:  number;
    peakCpuPct:      number;
    meanCpuPct:      number;
    sampleCount:     number;
  };
  modelContainer: {
    name:            string | null;
    available:       boolean;
    baselineCpuPct:  number;
    peakCpuPct:      number;
    meanCpuPct:      number;
    baselineMemMb:   number;
    peakMemMb:       number;
    meanMemMb:       number;
    sampleCount:     number;
  };
}

async function measureDetectionWithResources(
  n:         number,
  apiPid:    number | null,
  container: string | undefined,
): Promise<{ detection: DetectionResult; resources: ResourceResult }> {

  // — Process snapshot accumulators —
  const processSamples: ProcessSample[] = [];
  const dockerSamples:  DockerSample[]  = [];

  // — Baseline snapshot before requests begin —
  const baselineProc   = apiPid    ? sampleProcess(apiPid) : null;
  const baselineDocker = container ? await sampleDockerStats(container) : null;
  if (baselineProc)   processSamples.push(baselineProc);
  if (baselineDocker) dockerSamples.push(baselineDocker);

  // — Background sampler: process every 500 ms, docker every ~1.5 s —
  let sampling = true;
  let dockerTick = 0;

  const bgSample = async () => {
    while (sampling) {
      await sleep(500);
      if (!sampling) break;
      if (apiPid) {
        const s = sampleProcess(apiPid);
        if (s) processSamples.push(s);
      }
      dockerTick++;
      if (container && dockerTick % 3 === 0) {
        const ct = container; // capture for async closure
        void sampleDockerStats(ct).then((s) => { if (s) dockerSamples.push(s); });
      }
    }
  };

  void bgSample(); // fire-and-forget background loop

  // — Detection request loop —
  const raw:         number[] = [];
  let   modelLoaded           = false;

  for (let i = 0; i < n; i++) {
    const { ms, ok, status, body } = await timedPost(
      `${MODEL_URL}/detect`,
      { image_base64: TINY_PNG },
    );
    raw.push(ms);
    process.stdout.write(dim(`  /detect [${i + 1}/${n}] ${ms}ms  HTTP ${status}\r`));

    if (i === 0) {
      // Inspect first response to determine model state
      if (ok) {
        modelLoaded = true;
      } else if (status === 503) {
        const b = body as { detail?: string };
        warn(`Model weights not loaded (503): "${b.detail}" — latencies reflect 503 overhead`);
      }
    }
  }
  process.stdout.write('\n');

  // — Stop background sampler —
  sampling = false;
  await sleep(600); // let the last 500 ms interval flush

  // — Final snapshot —
  if (apiPid) {
    const s = sampleProcess(apiPid);
    if (s) processSamples.push(s);
  }
  if (container) {
    const s = await sampleDockerStats(container);
    if (s) dockerSamples.push(s);
  }

  // — Aggregate detection stats —
  const ds = stats(raw);
  done(
    `Detection  p50=${ds.p50}ms  p95=${ds.p95}ms` +
    `  min=${ds.min}ms  max=${ds.max}ms` +
    `  model_loaded=${modelLoaded}`,
  );

  // — Aggregate process stats —
  const procAvail = processSamples.length > 0;
  const procCpus  = processSamples.map((s) => s.cpuPercent);
  const procRss   = processSamples.map((s) => s.rssKb);

  const dockerAvail = dockerSamples.length > 0;
  const dkCpus      = dockerSamples.map((s) => s.cpuPercent);
  const dkMems      = dockerSamples.map((s) => s.memMb);

  if (procAvail) {
    done(
      `API process (PID ${apiPid})  rss=${Math.min(...procRss)}→${Math.max(...procRss)} KB` +
      `  cpu peak=${Math.max(...procCpus).toFixed(1)}%`,
    );
  }
  if (dockerAvail) {
    done(
      `Model container  cpu peak=${Math.max(...dkCpus).toFixed(1)}%` +
      `  mem ${Math.min(...dkMems).toFixed(0)}→${Math.max(...dkMems).toFixed(0)} MB`,
    );
  }

  return {
    detection: {
      samples:     n,
      modelLoaded,
      p50Ms:   ds.p50,
      p95Ms:   ds.p95,
      minMs:   ds.min,
      maxMs:   ds.max,
      meanMs:  ds.mean,
      rawMs:   raw,
    },
    resources: {
      apiProcess: {
        pid:            apiPid,
        available:      procAvail,
        baselineRssKb:  processSamples[0]?.rssKb              ?? 0,
        peakRssKb:      procAvail ? Math.max(...procRss)       : 0,
        minRssKb:       procAvail ? Math.min(...procRss)       : 0,
        meanRssKb:      procAvail ? round2(procRss.reduce((a, b) => a + b, 0) / procRss.length) : 0,
        baselineCpuPct: processSamples[0]?.cpuPercent          ?? 0,
        peakCpuPct:     procAvail ? Math.max(...procCpus)      : 0,
        meanCpuPct:     procAvail ? round2(procCpus.reduce((a, b) => a + b, 0) / procCpus.length) : 0,
        sampleCount:    processSamples.length,
      },
      modelContainer: {
        name:           container ?? null,
        available:      dockerAvail,
        baselineCpuPct: dockerSamples[0]?.cpuPercent           ?? 0,
        peakCpuPct:     dockerAvail ? Math.max(...dkCpus)       : 0,
        meanCpuPct:     dockerAvail ? round2(dkCpus.reduce((a, b) => a + b, 0) / dkCpus.length) : 0,
        baselineMemMb:  dockerSamples[0]?.memMb                 ?? 0,
        peakMemMb:      dockerAvail ? Math.max(...dkMems)       : 0,
        meanMemMb:      dockerAvail ? round2(dkMems.reduce((a, b) => a + b, 0) / dkMems.length) : 0,
        sampleCount:    dockerSamples.length,
      },
    },
  };
}

// ── Output ────────────────────────────────────────────────────────────────────

function writeBaseline(data: unknown): void {
  const dir = path.dirname(OUT_FILE);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2) + '\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(bold('\n╔══════════════════════════════════════════════════════════╗'));
  console.log(bold('║  Performance Baseline — AI Navigation System             ║'));
  console.log(bold('╚══════════════════════════════════════════════════════════╝'));
  note(`API:   ${API_URL}`);
  note(`Model: ${MODEL_URL}`);
  note(`Detection samples: ${DETECTION_SAMPLES}  Health samples: ${HEALTH_SAMPLES}`);
  note(`Output: ${OUT_FILE}`);

  const capturedAt = new Date().toISOString();
  let totalErrors  = 0;

  // — Preflight: verify services are reachable —
  section('Preflight — service reachability');
  let apiOk   = false;
  let modelOk = false;
  try {
    const r = await timedGet(`${API_URL}/health`);
    apiOk   = r.ok;
    done(`API /health → HTTP ${r.status} (${r.ms}ms)`);
  } catch (err) {
    warn(`API unreachable: ${errMsg(err)}`);
    totalErrors++;
  }
  try {
    const r = await timedGet(`${MODEL_URL}/health`);
    modelOk = r.ok;
    done(`Model /health → HTTP ${r.status} (${r.ms}ms)`);
  } catch (err) {
    warn(`Model unreachable: ${errMsg(err)}`);
    totalErrors++;
  }

  if (!modelOk) {
    console.log(`\n${yellow('Model service is not reachable — aborting.')} Start it with: pnpm start:model`);
    process.exit(1);
  }

  const modelContainer = dockerContainerOnPort(8080);
  const apiPid         = apiOk ? getApiPid() : null;

  if (modelContainer) note(`Model container: ${modelContainer}`);
  else                warn('Model not found in Docker — container metrics will be skipped');

  if (apiPid)  note(`API PID: ${apiPid}`);
  else if (apiOk) warn('API process PID not found — process metrics will be skipped');

  // ── 1. Cold start ────────────────────────────────────────────────────────────
  section('1 · Model cold-start time');

  let coldStart: ColdStartResult;

  if (SKIP_COLD_START) {
    warn('Skipped (--skip-cold-start)');
    coldStart = { skipped: true, skipReason: '--skip-cold-start flag' };
  } else if (!modelContainer) {
    warn('Skipped — model is not running inside Docker');
    coldStart = { skipped: true, skipReason: 'model not running in Docker' };
  } else {
    try {
      coldStart = await measureColdStart(modelContainer);
    } catch (err) {
      warn(`Cold start measurement failed: ${errMsg(err)}`);
      coldStart = { skipped: true, skipReason: errMsg(err) };
      totalErrors++;
    }
    // Brief pause after restart before measuring warm metrics
    info('Waiting 2 s for service to stabilise after restart…');
    await sleep(2_000);
  }

  // ── 2. Warm /health latency ────────────────────────────────────────────────
  section(`2 · Warm /health latency (${HEALTH_SAMPLES} samples)`);

  let warmHealth: HealthResult;
  try {
    warmHealth = await measureHealthLatency(HEALTH_SAMPLES);
  } catch (err) {
    warn(`Health measurement failed: ${errMsg(err)}`);
    warmHealth = {
      samples: 0, p50Ms: 0, p95Ms: 0, minMs: 0, maxMs: 0, meanMs: 0, rawMs: [],
    };
    totalErrors++;
  }

  // ── 3 + 4. Detection latency + resource usage ──────────────────────────────
  section(`3 · Detection latency + resource sampling (${DETECTION_SAMPLES} samples)`);

  if (apiPid)        info(`Sampling API process (PID ${apiPid}) every ~500 ms`);
  if (modelContainer) info(`Sampling model container (${modelContainer}) every ~1.5 s`);

  let detection: DetectionResult;
  let resources: ResourceResult;

  try {
    const r = await measureDetectionWithResources(
      DETECTION_SAMPLES,
      apiPid,
      modelContainer,
    );
    detection = r.detection;
    resources = r.resources;
  } catch (err) {
    warn(`Detection measurement failed: ${errMsg(err)}`);
    const empty: DetectionResult = {
      samples: 0, modelLoaded: false,
      p50Ms: 0, p95Ms: 0, minMs: 0, maxMs: 0, meanMs: 0, rawMs: [],
    };
    detection = empty;
    resources = {
      apiProcess: {
        pid: apiPid, available: false,
        baselineRssKb: 0, peakRssKb: 0, minRssKb: 0, meanRssKb: 0,
        baselineCpuPct: 0, peakCpuPct: 0, meanCpuPct: 0, sampleCount: 0,
      },
      modelContainer: {
        name: modelContainer ?? null, available: false,
        baselineCpuPct: 0, peakCpuPct: 0, meanCpuPct: 0,
        baselineMemMb: 0, peakMemMb: 0, meanMemMb: 0, sampleCount: 0,
      },
    };
    totalErrors++;
  }

  // ── Assemble baseline document ─────────────────────────────────────────────
  const baseline = {
    capturedAt,
    environment: {
      platform:        os.platform(),
      arch:            os.arch(),
      nodeVersion:     process.version,
      osTotalMemMb:    round2(os.totalmem() / 1024 / 1024),
      cpuModel:        os.cpus()[0]?.model ?? 'unknown',
      cpuCount:        os.cpus().length,
      apiUrl:          API_URL,
      modelUrl:        MODEL_URL,
      detectionSamples: DETECTION_SAMPLES,
      healthSamples:   HEALTH_SAMPLES,
    },
    coldStart,
    warmHealth,
    detection,
    resources: resources!,
  };

  // ── Write file ─────────────────────────────────────────────────────────────
  section('Output');
  writeBaseline(baseline);
  done(`Written: ${OUT_FILE}`);

  // ── Human-readable summary ─────────────────────────────────────────────────
  console.log(`\n${bold(hr('═'))}`);
  console.log(bold(' Summary'));
  console.log(bold(hr('═')));

  const row = (label: string, value: string) =>
    console.log(`  ${label.padEnd(32)} ${value}`);

  if (!coldStart.skipped) {
    row('Cold-start time',   `${coldStart.ms} ms`);
  } else {
    row('Cold-start time',   dim(`skipped — ${coldStart.skipReason}`));
  }

  row('Health p50',         `${warmHealth.p50Ms} ms`);
  row('Health p95',         `${warmHealth.p95Ms} ms`);
  row('Detection p50',      `${detection.p50Ms} ms  (model_loaded=${detection.modelLoaded})`);
  row('Detection p95',      `${detection.p95Ms} ms`);
  row('Detection min/max',  `${detection.minMs} / ${detection.maxMs} ms`);

  if (resources!.apiProcess.available) {
    const ap = resources!.apiProcess;
    row('API RSS baseline/peak', `${ap.baselineRssKb} / ${ap.peakRssKb} KB`);
    row('API CPU mean/peak',     `${ap.meanCpuPct}% / ${ap.peakCpuPct}%`);
  } else {
    row('API process metrics', dim('unavailable'));
  }

  if (resources!.modelContainer.available) {
    const mc = resources!.modelContainer;
    row('Model mem baseline/peak', `${mc.baselineMemMb.toFixed(0)} / ${mc.peakMemMb.toFixed(0)} MB`);
    row('Model CPU mean/peak',     `${mc.meanCpuPct}% / ${mc.peakCpuPct}%`);
  } else {
    row('Model container metrics', dim('unavailable'));
  }

  console.log(bold(hr('═')));
  const outcome = totalErrors === 0
    ? green('All measurements complete')
    : yellow(`${totalErrors} measurement(s) skipped or failed`);
  console.log(` ${outcome}`);
  console.log(bold(hr('═')) + '\n');

  if (totalErrors > 0) process.exit(1);
}

main().catch((err) => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
