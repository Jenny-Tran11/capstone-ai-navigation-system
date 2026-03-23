# Mobile & backend — implementation tickets (sequential backlog)

Use this file by copying **one ticket block at a time** into Cursor (chat or Agent):

- **Mobile:** *“Implement ticket MOB-XXX only; match existing `apps/mobile` patterns.”*
- **Backend:** *“Implement ticket BAK-XXX only; match `apps/aws` CDK + `packages/api` patterns.”*

**Conventions**

- **Depends on:** must be done before starting this ticket (or merge if parallel-safe).
- **AC** = acceptance criteria (checklist).
- **DoD** = definition of done.
- **FR** references map to [`docs/MOBILE_APP_PRD.md`](./MOBILE_APP_PRD.md).
- **Backend paths:** [`apps/aws/`](../apps/aws/) (CDK, detection Docker Lambda), [`packages/api/`](../packages/api/) (Node user API Lambda).

**Recommended order: backend first**

- Run **all `BAK-*` tickets** (deploy runbook, APIs, detection hardening, scripts, security pass), **then** **all `MOB-*` tickets**. That way deployed URLs, error shapes, and profile fields exist before the client integrates them.
- If you must parallelize, keep **BAK-001** and **BAK-006** finished before **MOB-002** / **MOB-006** at minimum.

**Cross-team**

- **BAK-006** (detection error `code` + body) is already satisfied before **MOB-002** / **MOB-006** when you follow backend-first.
- **BAK-003–BAK-005** enable real **MOB-019** sync instead of a stub.

---

## Epic A — Foundation

### MOB-001 — App shell, navigation, and a11y baseline

**Priority:** P0  
**Depends on:** —  
**Maps to:** NFR-1, foundation for all screens  

**Description**  
Set up root navigation (e.g. Expo Router or React Navigation stack + tabs) with: splash → onboarding gate (see MOB-004) → main tabs **Home**, **Navigate**, **Detect**, **Settings**. Ensure every screen has a unique `accessibilityLabel` on primary actions and a logical focus order. Use existing NativeWind / UI primitives where possible.

**Technical notes**

- Keep routes shallow; one place for “is onboarding complete” flag (placeholder until MOB-003).
- No business logic for maps/detection yet—placeholder screens with title + primary CTA.

**Acceptance criteria**

- [ ] Cold open lands on the correct first screen; user can reach all four tabs via screen reader (swipe/focus).
- [ ] Back behavior on Android does not trap the user (exits or pops as expected).
- [ ] All tab icons/buttons have visible labels **or** `accessibilityLabel` + hint where the icon is ambiguous.
- [ ] No raw text smaller than 16sp on primary CTAs (or document exception in code comment for dense debug UI).

**Definition of done**

- [ ] Runs with `npm run mobile` with no new red errors in Metro.
- [ ] Brief note in `apps/mobile/README.md` (one short paragraph) describing navigation structure—only if not already documented.

---

### MOB-002 — Environment validation and detection API client

**Priority:** P0  
**Depends on:** MOB-001  
**Maps to:** FR-DET-1..3, NFR-5  

**Description**  
Extend `apps/mobile/lib/env.ts` (or add `lib/detect-api.ts`) to read `EXPO_PUBLIC_DETECT_API_URL` and `EXPO_PUBLIC_DETECT_API_KEY`, normalize base URL (no double slashes), and expose a typed function `postDetect(image: Blob | ArrayBuffer | base64 per backend contract): Promise<DetectResponse>` with:

- configurable timeout (default 25s),
- user-safe error mapping (`network`, `timeout`, `unauthorized`, `server`, `unknown`).

**Acceptance criteria**

- [ ] Missing env vars surface a **developer-visible** warning in dev and a **user-safe** message in production builds (no key printed).
- [ ] `fetch` uses `AbortController` for timeout; aborted requests classify as `timeout`.
- [ ] Non-2xx responses parse error body when JSON; fall back to status text.
- [ ] TypeScript types match the backend response shape used by `packages/api` / Lambda (adjust if repo uses multipart vs JSON—**inspect repo and align**).

**Definition of done**

- [ ] Unit-test or minimal runtime test script optional; if skipped, document manual test steps in ticket reply.

---

### MOB-003 — Local persistence (preferences, onboarding, last detection)

**Priority:** P0  
**Depends on:** MOB-001  
**Maps to:** FR-ONB-3, FR-SET-*, FR-OFF-1  

**Description**  
Add AsyncStorage (or MMKV if you add the dep) module `lib/storage.ts` with versioned keys for:

- `onboardingCompleted: boolean`
- `prefs`: voice rate, verbosity, theme, haptics on/off, detection confirm toggle, detection cap per hour
- `lastDetectionSummary` + timestamp (text only, no image bytes)

**Acceptance criteria**

- [ ] Corrupt/missing storage does not crash the app; defaults apply.
- [ ] One exported hook or context `useAppPrefs()` for read/update.
- [ ] Migrations stub: if storage version bumps, reset only prefs key (document behavior).

**Definition of done**

- [ ] Settings screen can toggle one pref and survive app restart (wire minimal UI in MOB-012 or temporary debug row).

---

### MOB-004 — Onboarding: welcome, permissions, haptic test

**Priority:** P0  
**Depends on:** MOB-001, MOB-003  
**Maps to:** FR-ONB-1  

**Description**  
Implement first-launch flow: (1) Welcome + value prop, (2) **why we need** Location / Camera / Notifications (platform permission prompts), (3) optional **haptic test** button (`expo-haptics` if available), (4) “Get started” sets `onboardingCompleted` and enters main tabs.

**Acceptance criteria**

- [ ] If user denies location or camera, app still enters main app but shows **non-blocking** banners on relevant tabs with “Open settings” deep link.
- [ ] Screen reader reads each step in order; buttons announce state (e.g. “Granted” / “Not granted” where applicable).
- [ ] Completing onboarding is idempotent; reopening app skips onboarding.

**Definition of done**

- [ ] Tested on one Android and one iOS target (simulator OK) for permission flows.

---

## Epic B — Home and places

### MOB-005 — Home screen: Where to, Detect shortcut, recents

**Priority:** P0  
**Depends on:** MOB-001, MOB-003  
**Maps to:** FR-HOME-1..3  

**Description**  
Home tab: search field opening a destination picker flow (can be modal). Primary buttons: **Navigate** (goes to Navigate tab with selected destination if any), **Detect surroundings** (opens Detect tab or camera flow). Show **recent destinations** (last 5) and **saved places** shortcuts (empty state copy if none).

**Acceptance criteria**

- [ ] Tapping a recent item pre-fills destination for navigation (see MOB-007).
- [ ] Empty states are announced by screen reader (“No recent destinations”).
- [ ] Search supports keyboard; if `expo-speech` or OS dictation is easy, add microphone affordance **or** document follow-up.

**Definition of done**

- [ ] Recents stored in `lib/storage.ts` when user starts a trip (hook from MOB-007).

---

### MOB-011 — Saved places: home, work, favorites

**Priority:** P1  
**Depends on:** MOB-003, MOB-005  
**Maps to:** FR-PLC-1  

**Description**  
CRUD for saved places: label, address/coords string, type (`home` | `work` | `favorite`). Max 20 favorites. Voice-friendly labels required field.

**Acceptance criteria**

- [ ] User can set Home/Work from place detail or settings; only one home and one work.
- [ ] Favorites list accessible from Home and Settings.
- [ ] Deleting confirms with accessible dialog.

**Definition of done**

- [ ] Data persists across restarts.

---

## Epic C — AI detection

### MOB-006 — Camera capture, compress, upload, results UI

**Priority:** P0  
**Depends on:** MOB-002, MOB-004  
**Maps to:** FR-DET-1..3, FR-DET-5  

**Description**  
Detect tab: `expo-image-picker` or `expo-camera` flow to capture still photo; resize/compress (target ≤ ~1MB JPEG); call `postDetect`; show loading, success, failure. If prefs require **confirm before upload**, show preview step with “Upload” requiring **second activation** (double-tap or explicit confirm button labeled for a11y).

**Acceptance criteria**

- [ ] Errors never fail silently: user sees message + **Retry** + **Cancel**.
- [ ] Timeout shows specific copy (“Taking longer than expected”) and retry.
- [ ] On success: show text summary and **Speak** button using `expo-speech` (or OS TTS) with stop on blur/navigation.
- [ ] Last successful summary persisted per MOB-003.

**Definition of done**

- [ ] Manual test against real API URL or mock server documented in PR description.

---

### MOB-013 — Detection rate limit UX (429) and optional queue

**Priority:** P2  
**Depends on:** MOB-006, MOB-003  
**Maps to:** FR-DET-4, FR-SET-4  

**Description**  
Handle HTTP 429 with clear messaging (“Too many scans—try again in X minutes”). Optional setting: **queue failed uploads** when back under cap (simple retry on next app open or manual “Retry queued” button—no background worker required for MVP).

**Acceptance criteria**

- [ ] 429 distinct from 5xx and network errors in UI copy.
- [ ] Client-side cap: block new capture when hourly limit exceeded per prefs; show countdown if feasible.

**Definition of done**

- [ ] Document server vs client limits in Settings copy.

---

## Epic D — Navigation (walking)

### MOB-010 — Routing provider abstraction + mock mode

**Priority:** P0  
**Depends on:** MOB-001  
**Maps to:** FR-NAV-1 (foundation)  

**Description**  
Introduce `lib/routing/types.ts` and `lib/routing/provider.ts` with interface: `getWalkingRoute(from, to) -> { steps[], polyline?, duration?, distance? }`. Ship **mock provider** returning fixed steps for dev/demo. Document how to swap in Mapbox/Google/OSRM in README.

**Acceptance criteria**

- [ ] Navigate tab works end-to-end in mock mode: pick A→B, see step list.
- [ ] All UI strings for maneuvers go through one formatter for future i18n.

**Definition of done**

- [ ] Feature flag env e.g. `EXPO_PUBLIC_ROUTING_PROVIDER=mock|real` stubbed.

---

### MOB-007 — Walking route UI: map + step list + start trip

**Priority:** P0  
**Depends on:** MOB-005, MOB-010  
**Maps to:** FR-NAV-1  

**Description**  
Navigate tab: destination entry (reuse search from home), show **large-type step list** and a **map** (use `react-native-maps` or Expo Maps if already aligned with repo). High-contrast style toggle respects prefs. “Start” begins active guidance (MOB-008).

**Acceptance criteria**

- [ ] Map and list stay in sync for current step index.
- [ ] Pinch/zoom does not break a11y: map has summary text for current step.
- [ ] Saves destination to recents on **Start**.

**Definition of done**

- [ ] Works in mock mode without API keys.

---

### MOB-008 — Turn-by-turn: voice, distance, recalculation stub

**Priority:** P0  
**Depends on:** MOB-007, MOB-003  
**Maps to:** FR-NAV-2, FR-NAV-4  

**Description**  
While trip active: periodic location updates (`expo-location`); announce next maneuver with distance thresholds (e.g. at 200m, 50m). On deviation beyond threshold, call provider again for new route or show “Recalculating…” then update steps.

**Acceptance criteria**

- [ ] Background: only request foreground location unless product explicitly needs background (document in app.json permissions).
- [ ] Spoken prompts respect verbosity pref (brief vs detailed).
- [ ] Arrival: when within N meters of destination, announce arrival and end trip.

**Definition of done**

- [ ] Battery note in Settings references continuous location during navigation.

---

### MOB-009 — Heading cues and GPS quality

**Priority:** P1  
**Depends on:** MOB-008  
**Maps to:** FR-NAV-3, NFR-4  

**Description**  
Use compass heading when available to prepend “Facing northwest” (or cardinal) before first instruction after trip start. If accuracy > threshold, announce “GPS accuracy low” once per minute max.

**Acceptance criteria**

- [ ] Heading updates do not spam: debounce (e.g. 10s) or only on significant change.
- [ ] Simulator without compass degrades gracefully (skip heading, no crash).

**Definition of done**

- [ ] Document accuracy thresholds in code constants.

---

### MOB-014 — Route preferences (feature-flagged)

**Priority:** P2  
**Depends on:** MOB-010, MOB-012  
**Maps to:** FR-PLC-2, FR-PLC-3  

**Description**  
Add prefs: avoid stairs, prefer main roads (passed as options to real provider when implemented). Mock provider can ignore options but must log them in dev.

**Acceptance criteria**

- [ ] Toggle changes request params on next route fetch.
- [ ] If provider unsupported, show one-line “Limited support” in settings.

---

### MOB-015 — Trip sharing (MVP: share text)

**Priority:** P2  
**Depends on:** MOB-008  
**Maps to:** FR-NAV-5  

**Description**  
“Share trip” uses native share sheet with message: destination, started time, **last known location** link (geo URI) or plain coords. No backend required for MVP.

**Acceptance criteria**

- [ ] User can cancel share sheet with no side effects.
- [ ] Privacy note: “Shares your last known location when you tap share.”

---

## Epic E — Settings, offline, safety

### MOB-012 — Settings: voice, theme, haptics, privacy copy

**Priority:** P0  
**Depends on:** MOB-003  
**Maps to:** FR-SET-1..3, FR-SET-5  

**Description**  
Settings tab sections: **Voice** (rate, verbosity, language if feasible), **Appearance** (high contrast, font scale using RN `PixelRatio` or allowedTextScaling), **Haptics**, **Detection** (confirm before upload, hourly cap), **Data & privacy** (static copy: what is sent to `/detect`, no image retention on device beyond last summary).

**Acceptance criteria**

- [ ] Each control has accessibility label + hint where needed.
- [ ] High contrast changes core backgrounds/foregrounds app-wide (context + NativeWind classes).

**Definition of done**

- [ ] Changing font scale does not clip primary buttons on small devices (spot-check).

---

### MOB-016 — Offline behavior

**Priority:** P1  
**Depends on:** MOB-006, MOB-008, MOB-003  
**Maps to:** FR-OFF-1, FR-OFF-2  

**Description**  
Use `@react-native-community/netinfo` or Expo equivalent. When offline: disable new detection with explanation; allow viewing last summary. During active trip, show banner “Offline—using last route” and disable recalculation until online.

**Acceptance criteria**

- [ ] Transitions online/offline update UI within 5s.
- [ ] No unhandled promise rejections on network loss mid-request.

---

### MOB-017 — Battery warning during navigation

**Priority:** P2  
**Depends on:** MOB-008  
**Maps to:** FR-NOT-2  

**Description**  
If battery < 20% while navigating, show once-per-session banner + optional TTS: suggest reducing detection or ending trip.

**Acceptance criteria**

- [ ] Uses `expo-battery` or similar; works on Android+iOS.

---

### MOB-018 — SOS: emergency call + SMS + ICE contacts

**Priority:** P1  
**Depends on:** MOB-003, MOB-012  
**Maps to:** FR-SOS-1..3, FR-SOS-2  

**Description**  
Persistent **SOS** affordance (Settings + optional floating action on Home): hold 2s **or** triple-tap opens countdown (3s) with **Cancel** focus-first. On complete: `Linking.openURL('tel:...')` for local emergency number (use locale or setting); optional SMS via `expo-sms` to ICE contacts with geo URI. ICE fields: name, phone, medical notes (local storage; encrypt optional stretch).

**Acceptance criteria**

- [ ] Cancel is always reachable during countdown; TalkBack/VoiceOver announces countdown.
- [ ] If SMS unavailable, user sees explanation.
- [ ] Medical notes never sent to `/detect` API.

**Definition of done**

- [ ] Legal disclaimer line in Settings: “Use only in emergencies; verify local numbers.”

---

## Epic F — Account, telemetry, polish

### MOB-019 — Guest mode vs optional auth (stub)

**Priority:** P2  
**Depends on:** MOB-003, MOB-011  
**Maps to:** FR-ONB-2, FR-ONB-3  

**Description**  
Settings: “Sign in” placeholder screen explaining sync is coming soon **or** wire minimal Supabase/Auth0 if keys exist—**choose smallest scope**: stub is acceptable if it exposes the UX and stores nothing.

**Acceptance criteria**

- [ ] Guest users have full access to nav + detect.
- [ ] No crash when pressing Sign in (shows copy or web flow).

---

### MOB-020 — Telemetry opt-in (no images)

**Priority:** P2  
**Depends on:** MOB-012  
**Maps to:** FR-LOG-1  

**Description**  
If opted in, log anonymous events (screen view, detect latency ms, errors) to console in dev; in prod, no-op or plug provider. **Never** log base64 images.

**Acceptance criteria**

- [ ] Default off; turning on shows what is collected.
- [ ] Turning off stops further sends.

---

### MOB-021 — Export diagnostics bundle

**Priority:** P2  
**Depends on:** MOB-020  
**Maps to:** FR-LOG-2  

**Description**  
Button exports JSON file via share sheet: app version, OS, last 50 events, last error codes. No PII fields.

**Acceptance criteria**

- [ ] File opens as plain text; user reviews before sharing.

---

### MOB-022 — QA pass: NFR checklist

**Priority:** P1  
**Depends on:** MOB-008, MOB-006, MOB-012, MOB-004  
**Maps to:** NFR-1, NFR-2, NFR-6  

**Description**  
Manual test script in `docs/` or `apps/mobile/TESTING.md`: VoiceOver/TalkBack paths, cold start timing note, background location verification (should be **off** unless MOB-008 explicitly added background). Fix any P0/P1 issues found.

**Acceptance criteria**

- [ ] Documented steps reproduce on clean install.
- [ ] List of known limitations matches PRD non-goals.

---

## Epic G — Backend: operations & contracts

### BAK-001 — Deploy runbook and client env mapping

**Priority:** P0  
**Depends on:** —  
**Maps to:** NFR-5, integration with MOB-002  

**Description**  
Document end-to-end: deploy `BlindNavDetectionStack` and `BlindNavUserApiStack` (order, required context `account` / `region`), how to fetch **API URL**, **API key** (detection REST API), **User HTTP API** base URL, **User Pool ID**, **Client ID**, and map them to mobile `.env` (`EXPO_PUBLIC_DETECT_API_URL`, `EXPO_PUBLIC_DETECT_API_KEY`, plus future Cognito vars). Include one “smoke test” subsection (curl `POST /detect` with `x-api-key`).

**Technical notes**

- Prefer extending [`apps/aws/README.md`](../apps/aws/README.md); add a short [`docs/BACKEND_ENV.md`](./BACKEND_ENV.md) only if the README becomes crowded.
- Detection body contract today: JSON `{ "image_base64": "..." }` per [`apps/aws/lambda/detect/handler.py`](../apps/aws/lambda/detect/handler.py).

**Acceptance criteria**

- [ ] Every CloudFormation output needed for mobile or QA is named and explained (what to paste where).
- [ ] Document states that detection uses **API key** on API Gateway; user API uses **JWT** (Cognito).
- [ ] Commands use paths valid from repo root or `apps/aws` (state which cwd).

**Definition of done**

- [ ] A new teammate can configure `.env` and hit both APIs without reading Python/TS source.

---

### BAK-002 — User API: validation and consistent error JSON

**Priority:** P0  
**Depends on:** BAK-001  
**Maps to:** NFR-1 (predictable clients), API hygiene  

**Description**  
In [`packages/api`](../packages/api/) (Hono): add a small validation layer for `PUT /me` (and any new bodies in later tickets). Return JSON errors in a **stable shape**, e.g. `{ "error": string, "code"?: string }`, with appropriate status codes (400 validation, 401 unchanged, 413 if payload too large, 500 generic).

**Acceptance criteria**

- [ ] Invalid JSON, unknown fields policy documented (reject vs strip—pick one and apply consistently).
- [ ] `displayName` rules unchanged or stricter; errors use the shared shape.
- [ ] No stack traces or internal messages in 500 responses to clients.

**Definition of done**

- [ ] [`packages/api/README.md`](../packages/api/README.md) updated with error contract and examples.

---

### BAK-003 — User profile: `preferences` + `savedPlaces` in Dynamo

**Priority:** P1  
**Depends on:** BAK-002  
**Maps to:** FR-PLC-1, FR-SET-* (server-side backup), MOB-011 alignment  

**Description**  
Extend [`UserProfile`](../packages/api/src/lib/dynamo.ts) and `GET/PUT /me` to support optional:

- `preferences`: object (e.g. voice rate, theme, haptics)—define max depth / size (e.g. ≤ 8KB serialized).
- `savedPlaces`: array of `{ id, label, address, lat?, lng?, type? }` with max length (e.g. 20) and per-field length limits.

Merge semantics on `PUT`: replace whole `preferences` / `savedPlaces` if provided, or document PATCH-style if you add `PATCH /me`.

**Acceptance criteria**

- [ ] `GET /me` returns new fields when present; omits or nulls when absent (document choice).
- [ ] Oversized body rejected with 400/413 and `code` (e.g. `PAYLOAD_TOO_LARGE`).
- [ ] Dynamo item stays under 400KB item limit (validate total serialized size if needed).

**Definition of done**

- [ ] CDK unchanged unless new GSIs required (avoid unless necessary).

---

### BAK-004 — User profile: ICE contacts and medical notes

**Priority:** P1  
**Depends on:** BAK-002  
**Maps to:** FR-SOS-2, MOB-018 alignment  

**Description**  
Add optional fields to user profile: `iceContacts` (array of `{ name, phone }`, max 5) and `medicalNotes` (string, max 500). Validate E.164 or loose phone format; reject obvious garbage. Same error JSON as BAK-002.

**Acceptance criteria**

- [ ] Empty arrays / null clear optional data as documented.
- [ ] PII is not logged in Lambda `console.log` (audit handler).

**Definition of done**

- [ ] README documents fields and limits; no plaintext secrets in env.

---

### BAK-005 — User HTTP API: public health route (no JWT)

**Priority:** P2  
**Depends on:** BAK-001  
**Maps to:** ops / uptime  

**Description**  
In [`UserApiStack`](../apps/aws/stacks/user_stack.py): add a route (e.g. `GET /health`) **without** the JWT authorizer that returns `200` and `{ "ok": true }` (or version string). Keep `/me` and other routes protected.

**Acceptance criteria**

- [ ] `curl` without `Authorization` succeeds for `/health` only.
- [ ] CORS still allows expected methods if browser clients are used later.

**Definition of done**

- [ ] Output health URL documented in BAK-001 runbook (or README).

---

## Epic H — Backend: detection service

### BAK-006 — Detection Lambda: payload limits and production-safe errors

**Priority:** P0  
**Depends on:** BAK-001  
**Maps to:** FR-DET-3, MOB-002 / MOB-006, NFR-3  

**Description**  
Harden [`apps/aws/lambda/detect/handler.py`](../apps/aws/lambda/detect/handler.py): enforce maximum `image_base64` length (or decoded byte size) to cap memory/time; return structured JSON `{ "error": "...", "code": "..." }` for 400-class issues; for 500, omit `detail` unless env e.g. `DEBUG_ERRORS=true`.

**Acceptance criteria**

- [ ] Oversized payload fails fast with 413 or 400 + clear `code` (e.g. `IMAGE_TOO_LARGE`).
- [ ] Successful response shape unchanged: `detections`, `scene_description` (unless you version—document if changed).
- [ ] No uncaught exceptions leaking to API Gateway without a JSON body.

**Definition of done**

- [ ] Manual test: valid small image still returns 200.

---

### BAK-007 — Detection API Gateway: throttling UX contract

**Priority:** P2  
**Depends on:** BAK-006  
**Maps to:** FR-DET-4, MOB-013  

**Description**  
Review [`DetectionStack`](../apps/aws/stacks/detection_stack.py) throttling (usage plan + method settings). Add **gateway responses** or document expected **429** behavior for clients. Optionally align error body with `{ "error", "code" }` where API Gateway allows.

**Acceptance criteria**

- [ ] README documents rate/burst limits and that clients may receive 429.
- [ ] If custom 429 body is not possible, document raw API Gateway response so mobile can branch on status.

**Definition of done**

- [ ] MOB-013 can key off documented behavior.

---

## Epic I — Backend: observability & QA

### BAK-008 — User Lambda: CloudWatch alarms

**Priority:** P2  
**Depends on:** BAK-001  
**Maps to:** ops parity with detection stack  

**Description**  
In `UserApiStack`, add CloudWatch alarm(s) on the Node function **Errors** (and optionally **Duration** P95), similar in spirit to [`DetectionStack`](../apps/aws/stacks/detection_stack.py) alarms. SNS/email subscription optional (stub alarm only is acceptable for capstone).

**Acceptance criteria**

- [ ] Alarm appears in CDK synth with sensible threshold.
- [ ] Documented in README how to view and tune.

**Definition of done**

- [ ] `cdk synth` succeeds.

---

### BAK-009 — Backend smoke scripts

**Priority:** P1  
**Depends on:** BAK-001  
**Maps to:** FR-LOG-2 (support workflow), CI-friendly checks  

**Description**  
Add [`scripts/`](../scripts/) script(s) (Node or Python, match repo conventions): (1) `POST` to detection URL with a tiny test image and `x-api-key`; (2) optional `GET` user `/health` after BAK-005; (3) document obtaining a Cognito JWT (AWS CLI `initiate-auth` or hosted UI) for `GET /me`.

**Acceptance criteria**

- [ ] Script exits non-zero on HTTP failure.
- [ ] No secrets committed; reads from env vars or `.env.local` gitignored.

**Definition of done**

- [ ] Root or `apps/aws` README links to the script.

---

### BAK-010 — Backend security & IAM pass

**Priority:** P1  
**Depends on:** BAK-001, BAK-002, BAK-006  
**Maps to:** NFR-5  

**Description**  
Review IAM grants for User Lambda and Detection Lambda: least privilege (Dynamo only on users table; S3 only where needed). Confirm API keys are not in source. Update `.gitignore` if needed for local env files. Short checklist in `docs/BACKEND_ENV.md` or `apps/aws/README.md`.

**Acceptance criteria**

- [ ] Checklist covers: keys, JWT authorizer on user routes, detection `api_key_required`, public buckets blocked.
- [ ] No regression to deploy or synth.

**Definition of done**

- [ ] Checklist ticked by reviewer before demo.

---

## Dependency graph (quick reference)

### Backend (`BAK-*`) — do this block first

```text
BAK-001 → BAK-002, BAK-005, BAK-006, BAK-008, BAK-009, BAK-010
BAK-002 → BAK-003, BAK-004
BAK-006 → BAK-007
BAK-002 + BAK-006 → BAK-010 (recommended before final pass)
```

### Mobile (`MOB-*`) — after backend

```text
MOB-001 → MOB-002, MOB-003, MOB-004, MOB-010, MOB-012
MOB-003 → MOB-004, MOB-005, MOB-011, MOB-008, MOB-012, MOB-013, MOB-016, MOB-018, MOB-019
MOB-002 → MOB-006
MOB-004 → MOB-006
MOB-010 → MOB-007 → MOB-008 → MOB-009, MOB-015, MOB-017
MOB-005 → MOB-007, MOB-011
MOB-006 → MOB-013, MOB-016
MOB-008 → MOB-016
MOB-012 → MOB-014, MOB-020
MOB-020 → MOB-021
```

**Suggested Cursor order — default (backend first, then mobile):**  
`BAK-001 → BAK-002 → BAK-003 → BAK-004 → BAK-005 → BAK-006 → BAK-007 → BAK-008 → BAK-009 → BAK-010 → MOB-001 → MOB-003 → MOB-002 → MOB-004 → MOB-010 → MOB-012 → MOB-005 → MOB-007 → MOB-008 → MOB-006 → MOB-009 → MOB-011 → MOB-016 → MOB-018 → MOB-013 → MOB-014 → MOB-015 → MOB-017 → MOB-019 → MOB-020 → MOB-021 → MOB-022`

**Alternate — mobile-only or backend-only tracks:**  
Backend only: `BAK-001` … `BAK-010`. Mobile only: same `MOB-*` chain as above (assumes APIs already deployed and documented).

---

## Paste template for Cursor

Default sequence: **BAK-001 … BAK-010**, then **MOB-001 …** (see “Suggested Cursor order — default” above).

```text
Implement ticket MOB-XXX from docs/MOBILE_APP_TICKETS.md.
Scope: only this ticket. Do not implement future tickets.
After changes, list files touched and how to verify AC manually.
```

```text
Implement ticket BAK-XXX from docs/MOBILE_APP_TICKETS.md.
Scope: only this ticket. Do not implement future tickets.
After changes, list files touched and how to verify AC manually.
```
