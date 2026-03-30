# PRD — FR2.2 Navigation Lambda Microservice

**Parent document**: [PRD.md](../PRD.md) (Section 4 — Phase 2: AWS Cloud Deployment)  
**Feature ID**: FR2.2  
**Project**: Group 11 Capstone — AI-Assisted Navigation System for the Visually Impaired  
**Version**: 1.0  
**Last updated**: March 2026  

---

## 1. Summary

Deploy the walking-route logic currently implemented in `navigation_service.py` as an **AWS Lambda** function, exposed through **API Gateway** (HTTPS). The function accepts **origin and destination coordinates**, calls the **OSRM** routing API for pedestrian (`foot`) profiles, translates maneuvers into **spoken-style English strings**, and returns a **JSON payload** whose instruction list matches the behaviour and format produced by `NavigationEngine.get_walking_instructions()` today.

---

## 2. Problem & outcome

| Item | Detail |
|------|--------|
| **Problem** | Navigation exists only as a local Python module; mobile and cloud clients cannot obtain turn-by-turn walking instructions over a stable HTTPS API. |
| **Desired outcome** | A serverless **GET** (or equivalent) endpoint that returns **valid JSON** instructions with **Lambda cold-start < 3 s**, **warm invocation < 200 ms** (excluding upstream OSRM network time unless otherwise agreed — see §6), aligned with [PRD.md](../PRD.md) FR2.2 and the `/navigate` contract in FR2.4. |

---

## 3. Scope

### 3.1 In scope

- Lambda handler that invokes the same routing and parsing logic as `NavigationEngine` (OSRM `route/v1/foot/` with `steps=true`, `overview=false`, maneuver → English strings, distance appended in metres except for `arrive`).
- **Configurable OSRM base URL** via environment variable or Parameter Store (default may remain public `router.project-osrm.org` for MVP; production hardening is a risk item — see §10).
- API Gateway integration: path and query parameters consistent with parent **FR2.4** (`start_lat`, `start_lon`, `end_lat`, `end_lon`) or a documented JSON body alternative if API Gateway design chooses POST for symmetry with other endpoints.
- Structured **error responses** (e.g. missing params, OSRM non-200, `code != "Ok"`, no route) as JSON with stable `error` / `message` fields and appropriate HTTP status mapping.
- CloudWatch logging: request id, timing breakdown (handler vs OSRM) at INFO for latency verification.

### 3.2 Out of scope (handled by other FRs)

- **Geocoding** (`geocode_address` / `parse_location`) in the Lambda **for MVP** if parent FR2.2 is interpreted as **coordinates-only**; address → coords remains client-side or a future FR unless explicitly added here.
- API Gateway **global** auth, throttling policy, and multi-route composition (FR2.4).
- Amazon Polly TTS of instructions (FR2.3); this service returns **text instructions** only.
- Vision container / `/detect` (FR2.1, FR2.0).

---

## 4. Dependencies & prerequisites

| Dependency | Notes |
|------------|-------|
| **`navigation_service.py`** | Source of truth for instruction wording and step assembly; refactor **minimal** surface (e.g. extract pure function + thin Lambda handler) without changing output semantics unless approved. |
| **`config.py`** | `NOMINATIM_USER_AGENT` only needed if geocoding is later enabled in Lambda; not required for coordinate-only MVP. |
| **FR2.4** | Final public URL, method (GET vs POST), and auth must match the consolidated API Gateway spec. |
| **Network** | Lambda in a **VPC with NAT** or use a **public** OSRM endpoint reachable from Lambda’s runtimes; document which applies. |

---

## 5. Functional requirements

| ID | Requirement |
|----|-------------|
| FR2.2-F01 | Handler accepts **four numeric parameters**: start latitude/longitude, end latitude/longitude (names aligned with FR2.4: `start_lat`, `start_lon`, `end_lat`, `end_lon`). |
| FR2.2-F02 | Handler validates ranges (e.g. lat ∈ [-90, 90], lon ∈ [-180, 180]); invalid input returns **4xx** JSON error, not a stack trace. |
| FR2.2-F03 | On success, response body is **JSON** containing an ordered **array of instruction strings** equivalent to `get_walking_instructions(start_lon, start_lat, end_lon, end_lat)` (same ordering, punctuation, and distance rules). |
| FR2.2-F04 | OSRM base URL and request timeout are **configurable**; timeout errors map to **502/504** (team-chosen) with a clear JSON message. |
| FR2.2-F05 | When OSRM returns no route or `code != "Ok"`, response is **JSON** (e.g. empty `instructions: []` plus `error` detail, or purely error object — pick one and document in implementation notes). |
| FR2.2-F06 | Optional: include **metadata** in JSON (`distance_m`, `duration_s`) from OSRM if available without breaking clients; if added, must be **additive** (array remains the primary contract). |

---

## 6. Non-functional requirements

| ID | Category | Requirement |
|----|----------|-------------|
| FR2.2-NFR01 | **Cold start** | **p95 cold-start** (API Gateway → Lambda init → handler start, excluding OSRM) **< 3 seconds** under the agreed memory allocation and deployment package size. |
| FR2.2-NFR02 | **Warm path** | **p95 warm** handler duration (Lambda billed time from handler entry to return, **excluding** OSRM HTTP wait) **< 200 ms**; or, if measuring **end-to-end** including OSRM, explicitly document two metrics and which one gates acceptance (recommend: **handler-only** for the 200 ms target, **E2E** separately in dashboards). |
| FR2.2-NFR03 | **Correctness** | Golden routes (e.g. UOW Library → North Wollongong Station coordinates from `navigation_service.py` `__main__`) produce **byte-identical or semantically identical** instruction arrays vs local `NavigationEngine` for the same OSRM response snapshot (use recorded fixture if OSRM data drifts). |
| FR2.2-NFR04 | **Security** | No secrets in code; use IAM for AWS resources; HTTPS only at API Gateway. |
| FR2.2-NFR05 | **Dependencies** | Deployment package uses **pinned** `requests` (and minimal stdlib); no unnecessary heavy imports that inflate cold start. |

---

## 7. Response contract (current instruction format)

The **canonical** success payload centres on the list produced by `get_walking_instructions`:

- **Type**: JSON array of strings (or JSON object wrapping that array — must match FR2.4 final spec).
- **Content**: Each element is one step, e.g.  
  `"Turn left onto Example Street, and walk 120 meters."`  
  Final arrive step: no distance suffix, e.g. `"You will arrive at your destination."`

Implementations should freeze a **JSON Schema** or OpenAPI fragment in the repo when FR2.4 is finalised.

---

## 8. Acceptance criteria (release checklist)

Derived from [PRD.md](../PRD.md) §4 FR2.2, expanded for testability.

1. **Deploy**: Lambda + API Gateway (or equivalent HTTP front) deployed in the target AWS account; endpoint documented for the mobile/backend team.
2. **Cold start**: Measured **p95 < 3 s** for cold invocations per FR2.2-NFR01 methodology (document memory, region, and package size).
3. **Warm path**: Measured **p95 < 200 ms** per FR2.2-NFR02 (state explicitly whether OSRM time is in or out of scope for this number).
4. **JSON**: Responses are valid JSON; instruction list matches current local format for fixture tests.
5. **Errors**: Malformed coordinates and routing failures return structured JSON without leaking internal exceptions.
6. **Integration**: Callable using the same query shape as parent **FR2.4** `/navigate` (or documented delta if renamed).

---

## 9. Verification & metrics

| Check | Method |
|-------|--------|
| Format parity | Unit/integration tests comparing Lambda output to local `NavigationEngine` against **mocked OSRM** JSON fixtures. |
| Latency | CloudWatch Logs Insights or X-Ray for cold vs warm; optional canary route in production. |
| Load | Light concurrency test (e.g. 10 rps brief burst) to ensure no unexpected throttling before FR2.4 quotas are applied. |

---

## 10. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| **OSRM public API** rate limits or downtime ([PRD.md](../PRD.md) §9) | Timeouts + friendly errors; cache identical origin/destination in API Gateway or ElastiCache later; evaluate self-hosted OSRM or commercial routing for production. |
| **Cold start** from large deps | Keep handler minimal; avoid pulling vision/YOLO into this Lambda package. |
| **Lambda → OSRM** egress | Confirm routing (NAT / public subnet); document failure mode if OSRM blocks datacentre IPs. |
| **Ambiguous 200 ms metric** | Resolve in §6 before sign-off (handler-only vs E2E). |

---

## 11. Traceability

| Parent reference | This PRD |
|------------------|----------|
| [PRD.md](../PRD.md) FR2.2 | Sections 1–3, 8 |
| [PRD.md](../PRD.md) FR2.4 `/navigate` | §3.1, §5, §8 |
| [PRD.md](../PRD.md) §7.1, §7.3 (LambdaNav, sequence) | §1, §7 |
| [PRD.md](../PRD.md) Success Metrics — navigation accuracy | §9 golden routes |

---

## 12. Open decisions (to resolve before implementation)

1. **Measurement definition** for **warm < 200 ms**: Lambda handler only vs including OSRM HTTP latency.
2. **GET vs POST** for `/navigate` and exact parameter names (must align with FR2.4).
3. **OSRM hosting**: public endpoint for MVP vs dedicated instance / third-party API for capstone demo stability.
4. **Success JSON shape**: top-level array vs `{ "instructions": [...] }` and whether to add distance/duration fields (FR2.2-F06).
