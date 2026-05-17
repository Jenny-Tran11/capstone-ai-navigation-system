# Test Deliverables — AI Navigation System

## Round Metadata

| Field | Value |
|---|---|
| Test round | 1 |
| Test date | _YYYY-MM-DD_ |
| Prepared by | |
| Environment | ☐ Staging &nbsp; ☐ Production |

---

## 1. Git Commit SHA

| Artifact | Value |
|---|---|
| HEAD commit (full SHA) | `9d124bc93b7e43e20fa3a95346d72c6ce8691096` |
| Short ref | `9d124bc` |
| Branch at time of test | `test/testing-code` |
| Merge base with `main` | _run `git merge-base HEAD main` and record here_ |

> To reproduce the exact build tested: `git checkout 9d124bc93b7e43e20fa3a95346d72c6ce8691096`

---

## 2. APK Build Identifier

| Field | Value |
|---|---|
| APK filename | `capstone-ai-nav-<VERSION>-release.apk` |
| Expo build ID | _\<placeholder — populate from `eas build --list` output\>_ |
| EAS build profile | `preview` / `production` _(select one)_ |
| `app.json` version | _\<populate from `apps/mobile/app.json` `version` field\>_ |
| `app.json` buildNumber / versionCode | _\<populate from `apps/mobile/app.json`\>_ |
| SHA-256 checksum of APK | _run `shasum -a 256 <file>.apk` and record here_ |

---

## 3. Test Account List

> Passwords are excluded from this document. Credentials are stored in the team password manager under the **Capstone / UAT** vault entry.

| Account | Email | Role | Cognito User Pool | Notes |
|---|---|---|---|---|
| Primary test user | `example@devika.com` | Standard user | Local / Staging | Used for smoke tests and UAT sessions |
| Admin test user | _\<admin-email@domain.com\>_ | SUPER | Staging | Required for `/app-config/admin/*` routes |
| Secondary tester A | _\<tester-a@domain.com\>_ | Standard user | Staging | UAT session participant 1 |
| Secondary tester B | _\<tester-b@domain.com\>_ | Standard user | Staging | UAT session participant 2 |
| Secondary tester C | _\<tester-c@domain.com\>_ | Standard user | Staging | UAT session participant 3 |

---

## 4. Model Weight Version

| Field | Value |
|---|---|
| Weight file | `best.pt` |
| Training run identifier | _\<placeholder — e.g., `runs/train/exp42`\>_ |
| YOLO architecture | YOLOv8 _(confirm exact variant)_ |
| Dataset version | _\<placeholder — e.g., `revised-pedestrian-obstacle-v3`\>_ |
| Roboflow project / version | _\<populate from Roboflow dashboard\>_ |
| mAP\@0.5 (validation set) | _\<placeholder\>_ |
| SHA-256 of weight file | _run `shasum -a 256 best.pt` and record here_ |
| Hosted at | `MODEL_URL` environment variable in staging SSM |

---

## 5. Internal QA Notes

### 5.1 Issues Found and Fixed in This Round

| ID | Severity | Area | Description | Status | Fix commit |
|---|---|---|---|---|---|
| QA-001 | P2 | API tests | Wrong key order in `response-shapes.test.ts` location object assertion — `'lat'` sorted before `'label'` in expected array | Fixed | _\<sha\>_ |
| QA-002 | P2 | Smoke test | Node 20 wraps `ECONNREFUSED` inside `AggregateError` via `err.cause.errors[0]`; plain `.message` showed only "fetch failed" with no useful detail | Fixed | _\<sha\>_ |
| QA-003 | P2 | Perf script | `sampleDockerStats()` was synchronous (`execSync`), blocking the event loop during detection timing and corrupting latency measurements | Fixed — rewritten as async `spawn()` | _\<sha\>_ |
| QA-004 | P3 | Perf script | `import.meta.url` rejected by tsc under CJS target (TS1470); used to compute `REPO_ROOT` | Fixed — replaced with `process.argv[1]` | _\<sha\>_ |
| QA-005 | P3 | Perf script | TypeScript narrowing lost inside async Docker-stats callback — `container` possibly null | Fixed — captured to local `const ct` before callback | _\<sha\>_ |

### 5.2 Open Issues (Not Yet Fixed)

| ID | Severity | Area | Description | Owner | Target |
|---|---|---|---|---|---|
| | | | | | |

### 5.3 Test Coverage Summary

| Test suite | File | Cases | Result |
|---|---|---|---|
| Model health proxy | `apps/api/src/__tests__/model-health.test.ts` | 7 | ☐ All pass |
| Response shapes | `apps/api/src/__tests__/response-shapes.test.ts` | _\<n\>_ | ☐ All pass |
| E2E smoke test | `scripts/smoke-test.ts` | 5 steps | ☐ All pass |
| Performance baseline | `scripts/perf-baseline.ts` | — | ☐ Baseline captured |
| UAT sessions | `docs/uat-checklist.md` | 7 sections | ☐ Completed |

### 5.4 Performance Baseline Summary

> Populate after running `pnpm perf`. Baseline file stored at `baselines/perf-<timestamp>.json`.

| Metric | Value | Threshold |
|---|---|---|
| Model cold-start (s) | | ≤ 60 s |
| `/health` median latency (ms) | | ≤ 500 ms |
| Detection P50 latency (ms) | | ≤ 3 000 ms |
| Detection P95 latency (ms) | | ≤ 8 000 ms |
| API CPU during detection (%) | | ≤ 80 % |
| API RSS during detection (MB) | | ≤ 512 MB |

### 5.5 UAT Subjective Ratings Summary

| Tester | Q1 (Trust alerts) | Q2 (Speed acceptable) | Q3 (Would use daily) |
|---|---|---|---|
| Tester A | /5 | /5 | /5 |
| Tester B | /5 | /5 | /5 |
| Tester C | /5 | /5 | /5 |
| **Mean** | | | |

---

## 6. Go / No-Go Decision

### Exit Criteria Check

| Criterion | Result |
|---|---|
| Zero P0 crashes (app termination, data loss, complete service failure) | ☐ Met &nbsp; ☐ Not met |
| Two or fewer P1 issues (major feature broken, no workaround) | ☐ Met &nbsp; ☐ Not met |
| At least 2 / 3 UAT testers rate core journey at 4 / 5 or above | ☐ Met &nbsp; ☐ Not met |
| All API test suites passing | ☐ Met &nbsp; ☐ Not met |
| Performance baseline within thresholds | ☐ Met &nbsp; ☐ Not met |

### Decision

> ☐ **GO** — All exit criteria met. Approved for release / next milestone.  
> ☐ **NO-GO** — One or more exit criteria not met. See open issues above.  
> ☐ **CONDITIONAL GO** — Minor issues noted; approved with the following conditions:

**Conditions (if applicable):**

_\<describe any conditions here\>_

### Approvals

| Role | Name | Decision | Date |
|---|---|---|---|
| QA Lead | | ☐ GO &nbsp; ☐ NO-GO | |
| Engineering Lead | | ☐ GO &nbsp; ☐ NO-GO | |
| Project Owner | | ☐ GO &nbsp; ☐ NO-GO | |
