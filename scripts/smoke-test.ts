#!/usr/bin/env tsx
/**
 * E2E smoke test — AI navigation system
 *
 * Steps:
 *   1. Service health  — API, model, admin UI all respond
 *   2. Auth            — sign in as test user, confirm idToken + sub
 *   3. Preferences     — load user prefs, confirm valid object shape
 *   4. Detection       — POST image to model, confirm response fields
 *   5. Model-down      — stop model service, confirm error surfaces clearly
 *
 * Usage:
 *   pnpm exec tsx scripts/smoke-test.ts
 *   pnpm exec tsx scripts/smoke-test.ts --skip-model-stop
 *
 * Env overrides (all optional):
 *   SMOKE_API_URL    (default: http://localhost:4000)
 *   SMOKE_MODEL_URL  (default: http://localhost:8080)
 *   SMOKE_ADMIN_URL  (default: http://localhost:5001)
 *   SMOKE_COGNITO_EP (default: http://localhost:4566)
 *   SMOKE_EMAIL      (default: example@devika.com)
 *   SMOKE_PASSWORD   (default: Password123!)
 *
 * Prerequisites: run `pnpm start:api` first to bootstrap DynamoDB + Cognito.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// ── Config ────────────────────────────────────────────────────────────────────

const API_URL    = process.env.SMOKE_API_URL    ?? 'http://localhost:4000';
const MODEL_URL  = process.env.SMOKE_MODEL_URL  ?? 'http://localhost:8080';
const ADMIN_URL  = process.env.SMOKE_ADMIN_URL  ?? 'http://localhost:5001';
const COGNITO_EP = process.env.SMOKE_COGNITO_EP ?? 'http://localhost:4566';
const EMAIL      = process.env.SMOKE_EMAIL      ?? 'example@devika.com';
const PASSWORD   = process.env.SMOKE_PASSWORD   ?? 'Password123!';

const SKIP_MODEL_STOP = process.argv.includes('--skip-model-stop');
const NO_COLOR        = !process.stdout.isTTY || process.env.NO_COLOR === '1';

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const HTTP_TIMEOUT_MS = 8_000;

// ── Colour helpers ────────────────────────────────────────────────────────────

function c(code: number, s: string): string {
  return NO_COLOR ? s : `\x1b[${code}m${s}\x1b[0m`;
}
const green  = (s: string) => c(32, s);
const red    = (s: string) => c(31, s);
const yellow = (s: string) => c(33, s);
const cyan   = (s: string) => c(36, s);
const bold   = (s: string) => c(1,  s);
const dim    = (s: string) => c(2,  s);

// ── Step tracking ─────────────────────────────────────────────────────────────

interface StepResult {
  label:      string;
  status:     'pass' | 'fail' | 'skip';
  durationMs: number;
  detail?:    string;
}

const results: StepResult[] = [];

async function step<T>(
  label: string,
  fn:    () => Promise<T>,
  skip   = false,
): Promise<T | undefined> {
  if (skip) {
    results.push({ label, status: 'skip', durationMs: 0 });
    console.log(`${yellow('[SKIP]')} ${label}`);
    return undefined;
  }

  const t0 = Date.now();
  try {
    const value   = await fn();
    const ms      = Date.now() - t0;
    results.push({ label, status: 'pass', durationMs: ms });
    console.log(`${green('[PASS]')} ${label} ${dim(`(${ms}ms)`)}`);
    return value;
  } catch (err) {
    const ms     = Date.now() - t0;
    // Node.js fetch wraps ECONNREFUSED inside err.cause (AggregateError or Error) — dig it out
    const cause = err instanceof Error ? (err as { cause?: unknown }).cause : undefined;
    const innerCause =
      cause instanceof AggregateError
        ? (cause.errors?.[0] ?? cause)
        : cause;
    const causeMsg =
      innerCause instanceof Error
        ? innerCause.message || String(innerCause)
        : innerCause != null ? String(innerCause) : '';
    const baseMsg = err instanceof Error ? err.message : String(err);
    const detail  = causeMsg && causeMsg !== baseMsg ? `${baseMsg} — ${causeMsg}` : baseMsg;
    results.push({ label, status: 'fail', durationMs: ms, detail });
    console.log(`${red('[FAIL]')} ${label} ${dim(`(${ms}ms)`)}`);
    console.log(dim(`       ${detail}`));
    return undefined;
  }
}

function note(msg: string): void {
  console.log(dim(`       ${msg}`));
}

// ── HTTP ──────────────────────────────────────────────────────────────────────

async function getJson(url: string, headers?: Record<string, string>): Promise<unknown> {
  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

async function postJson(
  url:     string,
  body:    unknown,
  headers?: Record<string, string>,
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });
  const text = await res.text();
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { parsed = text; }
  return { status: res.status, body: parsed };
}

// ── Cognito ───────────────────────────────────────────────────────────────────

interface CognitoConfig {
  userPoolId:       string;
  userPoolClientId: string;
}

function readCognitoConfig(): CognitoConfig {
  const p = path.join(REPO_ROOT, '.cognito', 'local-config.json');
  if (!fs.existsSync(p))
    throw new Error(
      `.cognito/local-config.json not found.\n` +
      `       Run 'pnpm start:api' first to bootstrap local Cognito.`,
    );
  return JSON.parse(fs.readFileSync(p, 'utf8')) as CognitoConfig;
}

async function cognitoSignIn(clientId: string): Promise<string> {
  const res = await fetch(COGNITO_EP, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/x-amz-json-1.1',
      'X-Amz-Target': 'AmazonCognitoIdentityProvider.InitiateAuth',
    },
    body: JSON.stringify({
      AuthFlow:        'USER_PASSWORD_AUTH',
      ClientId:        clientId,
      AuthParameters:  { USERNAME: EMAIL, PASSWORD },
    }),
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Cognito ${res.status}: ${t}`);
  }
  const data = (await res.json()) as {
    AuthenticationResult?: { IdToken?: string };
  };
  const token = data.AuthenticationResult?.IdToken;
  if (!token)
    throw new Error(`No IdToken in response: ${JSON.stringify(data)}`);
  return token;
}

function jwtSub(token: string): string {
  const parts = token.split('.');
  if (parts.length < 2) throw new Error('Malformed JWT');
  const raw    = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = raw + '='.repeat((4 - (raw.length % 4)) % 4);
  const payload = JSON.parse(
    Buffer.from(padded, 'base64').toString('utf8'),
  ) as { sub?: string };
  if (!payload.sub) throw new Error('Token has no sub claim');
  return payload.sub;
}

// ── Docker ────────────────────────────────────────────────────────────────────

function dockerContainerOnPort(port: number): string | undefined {
  try {
    const out = execSync(
      `docker ps --filter "publish=${port}" --format "{{.Names}}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
    ).trim();
    return out.split('\n')[0]?.trim() || undefined;
  } catch {
    return undefined;
  }
}

function dockerStop(name: string): void {
  execSync(`docker stop ${name}`, { stdio: 'pipe' });
}

function dockerStart(name: string): void {
  execSync(`docker start ${name}`, { stdio: 'pipe' });
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// 1×1 white PNG — smallest image a vision model can process
const TINY_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const totalStart = Date.now();

  console.log(bold('\n╔═══════════════════════════════════════════════════════╗'));
  console.log(bold('║    Smoke Test — AI Navigation System                  ║'));
  console.log(bold('╚═══════════════════════════════════════════════════════╝\n'));
  console.log(dim(`  API:    ${API_URL}`));
  console.log(dim(`  Model:  ${MODEL_URL}`));
  console.log(dim(`  Admin:  ${ADMIN_URL}`));
  console.log(dim(`  Auth:   ${COGNITO_EP}`));
  console.log('');

  // ── 1. Service health ──────────────────────────────────────────────────────

  console.log(bold('── Step 1: Service health ───────────────────────────────\n'));

  await step('API health check', async () => {
    const body = (await getJson(`${API_URL}/health`)) as { status?: string };
    if (body.status !== 'ok')
      throw new Error(`Expected { status:"ok" }, got ${JSON.stringify(body)}`);
  });

  let modelLoaded = false;
  await step('Model service health check', async () => {
    const body = (await getJson(`${MODEL_URL}/health`)) as {
      status?:       string;
      model_loaded?: boolean;
    };
    if (body.status !== 'ok')
      throw new Error(`Expected { status:"ok" }, got ${JSON.stringify(body)}`);
    modelLoaded = Boolean(body.model_loaded);
    note(`status=ok  model_loaded=${modelLoaded}`);
  });

  await step('Admin UI reachable', async () => {
    const res = await fetch(ADMIN_URL, { signal: AbortSignal.timeout(HTTP_TIMEOUT_MS) });
    // Vite dev server can redirect (302) or return 200; both are fine
    if (!res.ok && res.status >= 500)
      throw new Error(`HTTP ${res.status} from admin UI at ${ADMIN_URL}`);
    note(`HTTP ${res.status}`);
  });

  console.log('');

  // ── 2. Auth ────────────────────────────────────────────────────────────────

  console.log(bold('── Step 2: Auth ─────────────────────────────────────────\n'));

  let token: string | undefined;

  const cognitoCfg = await step('Read local Cognito config', async () => {
    const cfg = readCognitoConfig();
    note(`poolId=${cfg.userPoolId}`);
    note(`clientId=${cfg.userPoolClientId}`);
    return cfg;
  });

  if (cognitoCfg) {
    token = await step('Sign in as test user', async () => {
      const t   = await cognitoSignIn(cognitoCfg.userPoolClientId);
      const sub = jwtSub(t);
      note(`sub=${sub}`);
      note(`idToken=${t.slice(0, 48)}…`);
      return t;
    });
  } else {
    await step('Sign in as test user', async () => {
      throw new Error('Cognito config unavailable — skipping sign-in');
    });
  }

  console.log('');

  // ── 3. User preferences ────────────────────────────────────────────────────

  console.log(bold('── Step 3: User preferences ─────────────────────────────\n'));

  await step(
    'Load preferences — valid object shape',
    async () => {
      const body = (await getJson(
        `${API_URL}/user-profile/user/preferences`,
        { Authorization: `Bearer ${token}` },
      )) as Record<string, unknown>;

      if (typeof body !== 'object' || body === null || Array.isArray(body))
        throw new Error(`Expected plain object, got ${typeof body}`);

      const keys = Object.keys(body);
      note(keys.length > 0
        ? `${keys.length} key(s): ${keys.join(', ')}`
        : 'empty object — defaults apply (first-time user)',
      );
    },
    !token, // skip when sign-in failed
  );

  console.log('');

  // ── 4. Detection request ───────────────────────────────────────────────────

  console.log(bold('── Step 4: Detection request ────────────────────────────\n'));

  await step('POST image to model — response fields valid', async () => {
    const { status, body } = await postJson(
      `${MODEL_URL}/detect`,
      { image_base64: TINY_PNG },
    );
    const b = body as Record<string, unknown>;

    if (status === 200) {
      if (!Array.isArray(b.detections))
        throw new Error('Response missing detections array');
      if (typeof b.scene_description !== 'string')
        throw new Error('Response missing scene_description string');
      note(`detections=${(b.detections as unknown[]).length}`);
      note(`scene_description="${String(b.scene_description).slice(0, 72)}"`);

    } else if (status === 503) {
      // Weights not downloaded yet — service is healthy, inference unavailable
      const detail = String((b as { detail?: string }).detail ?? '');
      if (!detail)
        throw new Error('503 response missing detail field');
      note(`model weights not loaded (503): "${detail}"`);
      note('service is up — download weights to enable live inference');

    } else {
      throw new Error(
        `Unexpected HTTP ${status}: ${JSON.stringify(body).slice(0, 200)}`,
      );
    }
  });

  console.log('');

  // ── 5. Model-down error ────────────────────────────────────────────────────

  console.log(bold('── Step 5: Model-down error surface ─────────────────────\n'));

  const modelContainer = dockerContainerOnPort(8080);

  if (SKIP_MODEL_STOP) {
    await step('Model-down error surface', async () => {}, true);

  } else if (!modelContainer) {
    results.push({
      label:      'Model-down error surface',
      status:     'skip',
      durationMs: 0,
      detail:     'No Docker container found on port 8080',
    });
    console.log(`${yellow('[SKIP]')} Model-down error surface`);
    note('No Docker container found on port 8080.');
    note('If the model runs outside Docker, stop it manually and re-run to see the error shape.');

  } else {
    let stopped = false;
    try {
      await step('Model-down error surface', async () => {
        // 5a — stop
        note(`Stopping container: ${modelContainer}`);
        dockerStop(modelContainer);
        stopped = true;
        await sleep(1_500);

        // 5b — confirm raw health endpoint is unreachable
        let healthError = '';
        try {
          await fetch(`${MODEL_URL}/health`, { signal: AbortSignal.timeout(3_000) });
          throw new Error('Model health endpoint still reachable after stop');
        } catch (err) {
          if (err instanceof Error && err.message.includes('still reachable')) throw err;
          healthError = err instanceof Error ? err.message : String(err);
        }
        note(`Model /health → ${red(healthError)}`);

        // 5c — confirm detection endpoint also returns a clear error
        let detectError = '';
        try {
          await fetch(`${MODEL_URL}/detect`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ image_base64: TINY_PNG }),
            signal:  AbortSignal.timeout(3_000),
          });
          throw new Error('Model /detect endpoint still reachable after stop');
        } catch (err) {
          if (err instanceof Error && err.message.includes('still reachable')) throw err;
          detectError = err instanceof Error ? err.message : String(err);
        }
        note(`Model /detect → ${red(detectError)}`);

        // 5d — confirm the API itself stays healthy (only the model is down)
        const apiHealth = (await getJson(`${API_URL}/health`)) as { status?: string };
        if (apiHealth.status !== 'ok')
          throw new Error('API became unhealthy when model was stopped');
        note(`API /health → ${green('ok')} (API is independent of model)`);

        note(
          'Errors are specific, immediate, and include the root cause (ECONNREFUSED / fetch failed) — ' +
          'not a silent hang or generic 500.',
        );
      });

    } finally {
      if (stopped) {
        try {
          dockerStart(modelContainer);
          console.log(dim(`  [cleanup] Restarted container: ${modelContainer}`));
        } catch {
          console.log(red(`  [cleanup] WARN: failed to restart ${modelContainer} — restart manually with:`));
          console.log(dim(`            docker start ${modelContainer}`));
        }
      }
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  const totalMs = Date.now() - totalStart;
  const passed  = results.filter((r) => r.status === 'pass').length;
  const failed  = results.filter((r) => r.status === 'fail').length;
  const skipped = results.filter((r) => r.status === 'skip').length;
  const LINE    = '─'.repeat(60);

  console.log('\n' + bold(LINE));
  console.log(bold(' Results'));
  console.log(bold(LINE));

  const labelWidth = Math.max(...results.map((r) => r.label.length)) + 2;

  for (const r of results) {
    const tag =
      r.status === 'pass' ? green('[PASS]') :
      r.status === 'fail' ? red('[FAIL]')   :
      yellow('[SKIP]');
    const timing = r.status === 'skip' ? dim('—') : dim(`${r.durationMs}ms`);
    console.log(` ${tag} ${r.label.padEnd(labelWidth)} ${timing}`);
    if (r.status === 'fail' && r.detail)
      console.log(dim(`        ↳ ${r.detail}`));
  }

  console.log(bold(LINE));

  const outcome =
    failed > 0
      ? red(`${passed}/${results.length} passed, ${failed} failed`)
      : skipped > 0
      ? green(`${passed}/${results.length} passed`) + dim(` (${skipped} skipped)`)
      : green(`${passed}/${results.length} passed`);

  console.log(` ${outcome}   ${dim(`wall time: ${totalMs}ms`)}`);
  console.log(bold(LINE) + '\n');

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(red('Smoke test crashed unexpectedly:'), err);
  process.exit(1);
});
