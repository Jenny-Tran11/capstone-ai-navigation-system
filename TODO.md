# Future implementation (living backlog)

Last reviewed: aligned with the repo snapshot. Checked items reflect behaviour that already exists in code; unchecked items are still open product or infra work.

## Mobile app

- [x] API-backed user preferences with AsyncStorage merge on load (`usePreferences`).
- [x] Route planning UI (Navigate tab: plan + start active navigation).
- [x] Voice output for navigation steps and detection (Speech).
- [x] Detection history screen (`/detection/user/my`).
- [x] Address search restricted to **Australian street addresses** (Places proxy + `types=address`, `components=country:au`).
- [x] Places autocomplete / details / geocode via **authenticated API** (no Google key in client for search).
- [ ] Sync queue for offline preference writes and conflict resolution.
- [ ] Full account screen (password change, email verification flows beyond basics).
- [ ] Onboarding for camera, voice, haptics, and safety copy (beyond current onboarding).
- [ ] Background / screen-locked detection behaviour and OS policies.
- [ ] Richer error states (missing API URL, model down, timeouts) with actionable UI.
- [ ] Client-adjustable detection settings UI (interval, max scans, verbosity) beyond prefs JSON.
- [ ] Broader a11y audit (screen reader, touch targets, themes).
- [ ] Battery / data usage messaging for live detection.
- [ ] Automated mobile tests.

## API

- [x] Authenticated user preferences GET/PUT.
- [x] Authenticated detection POST and user history list.
- [x] Places proxy endpoints (autocomplete, details, geocode) on user-profile service.
- [ ] Shared profile types across admin/mobile if still divergent.
- [ ] Admin user listing, detail, enable/disable, password reset (Cognito admin APIs).
- [ ] Rate limiting and **server-side** max-scans enforcement.
- [ ] Structured error contract for all routes.
- [ ] API integration tests in CI.

## Admin app

- [ ] User management list, detail, filters, pagination.
- [ ] Audit log for admin actions.
- [ ] Preferences / app-config validation UI.
- [ ] Model health dashboard.

## Model service

- [ ] `/health` with model version metadata.
- [ ] Per-request or per-user confidence thresholds.
- [ ] Richer response fields (distance, urgency, action hints).
- [ ] Class prioritisation and benchmarks.
- [ ] Warm-up and structured logging.

## Product and safety

- [ ] MVP acceptance criteria documented.
- [ ] Safety disclaimer (assistive only, not a replacement for mobility aids).
- [ ] Privacy / retention / consent for images and history.
- [ ] Release and field-test checklists.
