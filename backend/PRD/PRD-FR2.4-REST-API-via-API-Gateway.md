# PRD — FR2.4 REST API via API Gateway

**Parent document**: [PRD.md](../PRD.md) (Section 4 — Phase 2: AWS Cloud Deployment)  
**Feature ID**: FR2.4  
**Project**: Group 11 Capstone — AI-Assisted Navigation System for the Visually Impaired  
**Version**: 1.0  
**Last updated**: March 2026  

---

## 1. Summary

Expose a **single HTTPS API** on **Amazon API Gateway** that fronts the three backend integrations described in the parent architecture: **obstacle detection** (`POST /detect`), **walking navigation** (`GET /navigate`), and **text-to-speech** (`POST /speak`). This PRD defines the **public contract** (paths, methods, payloads, responses, errors), **authentication** (API key and/or Amazon Cognito), **cross-cutting behaviour** (CORS, throttling, logging), and the **end-to-end latency** acceptance target. Implementation of vision inference, OSRM routing, and Polly synthesis remains owned by **FR2.0/FR2.1**, **FR2.2**, and **FR2.3** respectively.

---

## 2. Problem & outcome

| Item | Detail |
|------|--------|
| **Problem** | Mobile and other clients need **one stable base URL**, consistent **JSON/binary** contracts, and **enforced access control** instead of ad hoc per-service endpoints. |
| **Desired outcome** | A documented, testable **REST API** with the three routes in [PRD.md](../PRD.md) FR2.4; **all** successful round-trips complete in **< 2 seconds** under acceptance conditions; **API key** or **Cognito** auth is **mandatory** on every route. |

---

## 3. Scope

### 3.1 In scope

- **API Gateway** REST or HTTP API: routes **`POST /detect`**, **`GET /navigate`**, **`POST /speak`** (path prefix such as `/v1` is optional but must be documented once chosen).
- **Integration**: Map each route to the correct compute target—**EC2/container** or **Lambda** for `/detect` per deployment choice ([PRD.md](../PRD.md) §7.1), **Lambda** for `/navigate`, **Lambda** for `/speak`.
- **Authentication**: Enforce **usage plans + API keys** and/or **Cognito User Pools authorizer** (JWT); reject unauthenticated calls with **401/403** without invoking backends.
- **HTTPS only**; TLS termination at API Gateway; no plaintext HTTP in production.
- **Throttling** and **quotas** at API Gateway (per-stage or per-usage-plan) aligned with capstone traffic and [PRD.md](../PRD.md) NFR-5 where applicable.
- **CORS**: If the mobile or web client calls the API from a browser context, configure allowed origins, methods, and headers explicitly.
- **Unified error envelope** for JSON errors (stable fields, e.g. `error`, `message`, optional `requestId`); **binary** routes (`/speak`) use JSON errors only when the response is not audio (4xx/5xx before synthesis).
- **OpenAPI 3** (or equivalent) checked into the repo as the **source of truth** for the public API after sign-off.
- **Access logging** (API Gateway execution/access logs) with correlation to backend request ids where possible.

### 3.2 Out of scope (handled by other FRs)

- **Detection model accuracy, packaging, and inference** — **FR2.0**, **FR2.1**; this PRD only specifies the **HTTP** shape for image in and JSON out.
- **Navigation instruction wording and OSRM integration** — **FR2.2**; this PRD specifies **query parameters** and that the response is **JSON** instructions.
- **Polly voice, engine, streaming, synthesis latency** — **FR2.3**; this PRD specifies **`POST` body** (e.g. `text`) and **MP3** (or negotiated) response headers.
- **Full CloudWatch dashboards and alarms** — **FR2.6** (minimal Gateway logging for this feature is in scope above).

---

## 4. Dependencies & prerequisites

| Dependency | Notes |
|------------|-------|
| **FR2.0 / FR2.1** | A reachable **`/detect`** backend that accepts the chosen image encoding and returns spatial detection JSON. |
| **FR2.2** | **`/navigate`** Lambda (or equivalent) accepting **FR2.4** query params and returning instruction JSON. |
| **FR2.3** | **`/speak`** Lambda returning **audio/mpeg** (or agreed type) for valid `text`. |
| **IAM / CloudFormation / CDK** | Gateway permissions to invoke Lambdas and, if used, **VPC** / **ALB** integration for vision service. |
| **Mobile client** | Capable of attaching **API key** header or **Bearer** token and handling **multipart** or **base64** for camera frames per final contract. |

---

## 5. Functional requirements

| ID | Requirement |
|----|-------------|
| FR2.4-F01 | **`POST /detect`**: Accepts an image as **base64 in JSON** and/or **multipart/form-data** (team picks one or supports both and documents precedence); returns **JSON** describing detections with **spatial descriptions** consistent with the vision service output. |
| FR2.4-F02 | **`GET /navigate`**: Requires query parameters **`start_lat`**, **`start_lon`**, **`end_lat`**, **`end_lon`** (numeric); returns **JSON** whose primary content is an ordered list of **spoken-style instruction strings** (exact wrapper shape frozen in OpenAPI—array vs `{ "instructions": [...] }`). |
| FR2.4-F03 | **`POST /speak`**: Accepts **JSON** with field **`text`** (UTF-8); returns **binary audio** (default **MP3**) with correct **`Content-Type`** on success. |
| FR2.4-F04 | **Authentication**: Every route requires **valid API key** and/or **valid Cognito JWT**; configuration documented for mobile developers. |
| FR2.4-F05 | **Errors**: Malformed input, auth failure, upstream timeout, and payload-too-large responses use the **agreed JSON error schema** and appropriate **4xx/5xx** status codes; **no** stack traces or internal ARNs in client-visible bodies. |
| FR2.4-F06 | **Request size limits**: API Gateway and integration **payload limits** documented; **`/detect`** max image size enforced with **413** or **400** and clear message. |
| FR2.4-F07 | **Idempotency**: Not required for MVP; optional **`Idempotency-Key`** header reserved for future use if documented. |

---

## 6. Non-functional requirements

| ID | Category | Requirement |
|----|----------|-------------|
| FR2.4-NFR01 | **Latency** | For each endpoint, **p95 end-to-end round-trip** (client request through API Gateway to backend and back, **excluding** client-side image encode if measured from Gateway edge) **< 2 seconds** under acceptance test conditions (same region as API, warm backends where applicable, representative payloads). |
| FR2.4-NFR02 | **Security** | TLS **1.2+**; API keys **not** committed to source control; Cognito app client configuration follows AWS best practices; least-privilege IAM for integrations. |
| FR2.4-NFR03 | **Availability** | Single regional API is acceptable for capstone; document **stage** (`dev` / `prod`) and base URL in README or runbook. |
| FR2.4-NFR04 | **Consistency** | All JSON responses use **UTF-8**; dates/ids in errors follow one convention (ISO 8601 / UUID) documented in OpenAPI. |
| FR2.4-NFR05 | **Throttling** | Gateway returns **429** with parseable body when limits exceeded; client backoff documented for mobile team. |

---

## 7. Endpoint contracts (summary)

Freeze full schemas in OpenAPI; this table aligns with [PRD.md](../PRD.md) FR2.4.

| Endpoint | Method | Request | Success response |
|----------|--------|---------|------------------|
| `/detect` | POST | Image (**base64** and/or **multipart**) | **200** + JSON (detections + spatial descriptions) |
| `/navigate` | GET | `start_lat`, `start_lon`, `end_lat`, `end_lon` | **200** + JSON (instruction list) |
| `/speak` | POST | JSON `{ "text": "..." }` | **200** + **MP3** bytes (`audio/mpeg`) |

**Headers (illustrative)**:

- Client: `Authorization: Bearer <token>` and/or `x-api-key: <key>` per chosen auth mode.
- `/speak` success: `Content-Type: audio/mpeg` (and `Content-Length` or chunked per implementation).

---

## 8. Acceptance criteria (release checklist)

Derived from [PRD.md](../PRD.md) §4 FR2.4, expanded for testability.

1. **Routes**: All three operations are reachable on the **documented base URL** with correct HTTP method and path.
2. **Responses**: **`/detect`** and **`/navigate`** return **valid JSON** matching OpenAPI examples; **`/speak`** returns playable **MP3** for sample strings.
3. **Latency**: Measured **p95 round-trip < 2 s** per route under agreed test methodology (document region, payload sizes, and whether Lambda/EC2 is warm).
4. **Auth**: Calls **without** valid credentials receive **401/403** and **do not** hit backends (verify with CloudWatch/log absence or mock).
5. **Errors**: Invalid coordinates, empty `text`, oversize image, and simulated upstream failure return **structured JSON** and correct status codes.
6. **Documentation**: **OpenAPI** file versioned in repo; mobile team has **curl** or Postman examples for all three routes.

---

## 9. Verification & metrics

| Check | Method |
|-------|--------|
| Contract | CI or manual **OpenAPI validation**; smoke tests per route. |
| Latency | Scripted tests from same region; optional CloudWatch **latency** dimensions on integrations. |
| Auth | Negative tests (no key, bad token, expired JWT). |
| CORS | Browser preflight test if applicable. |

---

## 10. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| **2 s budget** tight for cold **EC2/Lambda** + large images | Tune **`/detect`** payload size, use regional colocation, document **warm** vs **cold** in acceptance notes; align with [PRD.md](../PRD.md) §6 NFR-1. |
| **Dual auth** (API key + Cognito) complexity | Start with **one** mode for MVP if product agrees; document migration path. |
| **Binary + JSON** error mapping in API Gateway | Use **Lambda proxy** or **HTTP integration** response templates tested for 4xx paths. |
| **Multipart vs base64** drift between clients | Pick a **primary** encoding for mobile; optional second encoding documented. |

---

## 11. Traceability

| Parent reference | This PRD |
|------------------|----------|
| [PRD.md](../PRD.md) FR2.4 | Sections 1–3, 5, 7, 8 |
| [PRD.md](../PRD.md) §7.1 (APIGW, three routes) | §1, §3.1, §7 |
| [PRD.md](../PRD.md) §7.3 (sequence: navigate, detect, speak) | §1, §7 |
| [PRD.md](../PRD.md) §6 NFR-1, NFR-4, NFR-5 | §6, §10 |

---

## 12. Open decisions (to resolve before implementation)

1. **REST API vs HTTP API** on API Gateway (cost, features, JWT authorizer ergonomics).
2. **API key only**, **Cognito only**, or **both** (e.g. key for dev, Cognito for prod).
3. **`/detect`**: **base64-only**, **multipart-only**, or **both**; max image dimensions and file size.
4. **Stage naming and custom domain** (optional): `api.example.com` vs default execute-api URL.
5. **Exact JSON shape** for detections and for navigate (top-level array vs wrapped object)—must match **FR2.2** / vision handlers after single pass review.
6. **Whether `GET /navigate` remains GET** or becomes **POST** with JSON body for symmetry (if changed, update parent PRD and OpenAPI together).
