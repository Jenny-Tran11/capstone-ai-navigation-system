# PRD — FR2.3 Amazon Polly TTS Integration

**Parent document**: [PRD.md](../PRD.md) (Section 4 — Phase 2: AWS Cloud Deployment)  
**Feature ID**: FR2.3  
**Project**: Group 11 Capstone — AI-Assisted Navigation System for the Visually Impaired  
**Version**: 1.0  
**Last updated**: March 2026  

---

## 1. Summary

Replace the **local** text-to-speech path in `voice_service.py` (macOS `say`, Windows `pyttsx3`, console fallback elsewhere) with **Amazon Polly** for cloud-backed synthesis. The service uses Polly’s **Neural** engine with an **Australian English** voice (default **Olivia**, `en-AU`) and returns **streamable** audio—**MP3** as the primary format, with **OGG (Vorbis)** as an optional output—so mobile and API clients can play navigation and alert phrases without device-local TTS engines.

Implementation aligns with the parent architecture (**Lambda** in front of Polly, behind **API Gateway** on **`POST /speak`**) described in [PRD.md](../PRD.md) §7.1 and FR2.4.

---

## 2. Problem & outcome

| Item | Detail |
|------|--------|
| **Problem** | Local TTS does not scale to the mobile/cloud architecture; clients need **consistent voice quality**, **Australian English** support, and **HTTP-delivered audio** instead of server-side speakers or OS-specific APIs. |
| **Desired outcome** | A **Polly-backed** synthesis path that meets [PRD.md](../PRD.md) FR2.3: **Neural** engine, agreed default voice, **< 1 second** to produce audio for inputs up to **200 characters**, with **MP3** (and optionally **OGG**) as a **streamable** response body suitable for `POST /speak`. |

---

## 3. Scope

### 3.1 In scope

- **AWS Polly** integration via **IAM-authenticated** API calls (e.g. `boto3` `synthesize_speech` or equivalent in the chosen runtime).
- **Engine**: `neural` (or team-documented successor) for the default voice.
- **Default voice**: **Olivia** (`en-AU`) unless product/accessibility review selects another **Neural** `en-AU` voice; voice and engine **configurable** via environment variables or Parameter Store.
- **Output formats**: **MP3** required; **OGG Vorbis** optional if clients request it (query param or `Accept` / content negotiation—must match **FR2.4** final contract).
- **Request contract**: Accept **plain text** (and optionally **SSML**) in the shape agreed with **FR2.4** (`POST /speak`, body field `text` or documented alias).
- **Streaming**: Prefer **streaming synthesis** where the SDK supports it so the client can start playback before the full utterance is buffered; if the MVP uses non-streaming Polly APIs, document **time-to-first-byte** behaviour and still meet the **< 1 s** acceptance target for ≤200 characters on the agreed network path.
- **Validation**: Reject empty or oversized payloads with **4xx** JSON errors; cap maximum input length (≥200 for acceptance tests; upper bound for abuse prevention, e.g. 3k–5k chars, team-defined).
- **Observability**: CloudWatch logs for request id, **synthesis latency** (Polly round-trip), and Polly error codes (throttling, invalid voice, etc.).

### 3.2 Out of scope (handled by other FRs)

- **API Gateway** route composition, **API keys** / **Cognito**, and global throttling (**FR2.4**).
- **Vision** (`/detect`) and **navigation** (`/navigate`) logic (**FR2.1**, **FR2.2**).
- **Full** CloudWatch dashboards and alarms (**FR2.6**) — *minimal metrics/logs for this Lambda only are in scope*.
- **Desktop** `voice_service.py` behaviour: may remain as a **dev fallback** or be **deprecated** behind a feature flag; production mobile path uses Polly only.

---

## 4. Dependencies & prerequisites

| Dependency | Notes |
|------------|-------|
| **`voice_service.py`** | Current local TTS reference; replacement or wrapper should preserve any **call-site expectations** (e.g. “given text, produce audio”) for code that has not yet moved to HTTP-only clients. |
| **FR2.4** | **`POST /speak`**: request/response shape, `Content-Type` for audio responses, auth—must match consolidated OpenAPI/API Gateway spec. |
| **IAM** | Lambda execution role with **`polly:SynthesizeSpeech`** (and **`polly:DescribeVoices`** if used at startup). |
| **AWS region** | Polly voice availability is **region-specific**; default region must support **Neural** + chosen `en-AU` voice. |
| **Mobile client** | Ability to play **MP3** (and **OGG** if offered) from HTTP response body or URL—see Phase 3 PRD items for playback UX. |

---

## 5. Functional requirements

| ID | Requirement |
|----|-------------|
| FR2.3-F01 | Handler accepts **UTF-8 text** in the **FR2.4**-defined field (e.g. JSON `text`); empty string returns **400** with structured error. |
| FR2.3-F02 | Synthesis uses **Neural** engine and default voice **Olivia** (`en-AU`) unless overridden by configuration. |
| FR2.3-F03 | Success response body is **binary audio** with **`Content-Type: audio/mpeg`** for MP3 (and **`audio/ogg`** if OGG is supported). |
| FR2.3-F04 | For inputs **≤ 200 characters**, end-to-end **server-side** synthesis completes within **< 1 second** under acceptance test conditions (region, warm Lambda, no client network)—see §6 for measurement definition. |
| FR2.3-F05 | **Throttling** or **Polly errors** return **5xx** (or **429** if mapped) with **JSON** error body from API Gateway/Lambda mapping—**no** raw stack traces to clients. |
| FR2.3-F06 | Optional: support **`TextType`** `ssml` behind a flag or separate endpoint prefix; if enabled, validate SSML and return **400** on parse errors. |

---

## 6. Non-functional requirements

| ID | Category | Requirement |
|----|----------|-------------|
| FR2.3-NFR01 | **Latency** | For **≤ 200 characters**, **p95** synthesis time (Lambda handler: Polly request sent → full audio received in memory or stream end) **< 1 s** in the target region with **warm** Lambda; document cold-start separately. |
| FR2.3-NFR02 | **Streaming** | Response is **streamable** (chunked HTTP or streaming SDK): client can begin playback without waiting for entire MP3/OGG file where the platform allows. |
| FR2.3-NFR03 | **Cost / quotas** | Team documents expected **monthly capstone** usage; handle **throttling** gracefully (retry with backoff or clear user-facing error). |
| FR2.3-NFR04 | **Security** | No long-lived AWS keys in repo; **IAM role** on Lambda; HTTPS only at API Gateway. |
| FR2.3-NFR05 | **Dependencies** | Pin **`boto3`** / botocore (or lockfile equivalent) compatible with Lambda runtime. |

---

## 7. Response contract (audio)

- **Success**: HTTP **200**, body = audio bytes, headers include correct **`Content-Type`** and, if applicable, **`Content-Length`** or **chunked** transfer.
- **Errors**: JSON with stable fields (e.g. `error`, `message`) and HTTP status per team convention—consistent with **FR2.4** error schema.

Freeze an **OpenAPI** fragment for `/speak` when **FR2.4** is finalised.

---

## 8. Acceptance criteria (release checklist)

Derived from [PRD.md](../PRD.md) §4 FR2.3, expanded for testability.

1. **Polly**: Invocations use **Neural** engine and **Olivia** (`en-AU`) by default; override via env is documented.
2. **Format**: **MP3** output plays correctly on target mobile/browser clients; **OGG** included only if explicitly implemented and tested.
3. **Latency**: For **≥ 30** warm requests of representative sentences **≤ 200 characters**, **p95** server-side synthesis **< 1 s** (methodology recorded in CloudWatch or test harness).
4. **Streaming**: Documented behaviour confirms audio is **streamable** per §6 (or MVP limitation explicitly signed off).
5. **Integration**: **`POST /speak`** matches **FR2.4** path, auth, and error shape.
6. **Local parity**: Product decision recorded: **`voice_service.py`** deprecated, feature-flagged, or retained **only** for offline desktop demos.

---

## 9. Verification & metrics

| Check | Method |
|-------|--------|
| Voice / engine | Integration test asserting `Engine=neural` (or API equivalent) and voice id in Polly request (mock or recorded request). |
| Latency | Scripted calls from same region as Lambda; log **Polly** duration dimension; optional CloudWatch metric. |
| Audio validity | Decode MP3 header / duration sanity check in test; manual playback smoke test. |
| Errors | Unit tests for empty body, over-max length, and mocked `Throttling` exception mapping. |

---

## 10. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| **Polly** regional voice availability differs | Choose region + voice in **§12** before deploy; verify with `DescribeVoices`. |
| **Cold start** pushes perceived latency over 1 s | Keep package small; provisioned concurrency optional for demo; measure **warm** path for acceptance. |
| **Cost** on Free Tier / capstone budget | Estimate characters/month; cap payload length; reuse caching for identical short strings only if safe (privacy). |
| **SSML** injection if SSML enabled | Strict validation, reject disallowed tags, or plain-text only for MVP. |

---

## 11. Traceability

| Parent reference | This PRD |
|------------------|----------|
| [PRD.md](../PRD.md) FR2.3 | Sections 1–3, 8 |
| [PRD.md](../PRD.md) FR2.4 `POST /speak` | §3.1, §5, §7, §8 |
| [PRD.md](../PRD.md) §7.1 (LambdaPolly, sequence) | §1, architecture |
| [PRD.md](../PRD.md) component table `voice_service.py` | §1, §3.2 |

---

## 12. Open decisions (to resolve before implementation)

1. **Streaming API choice**: Polly **streaming** operation vs single `SynthesizeSpeech` response for MVP.
2. **OGG support**: ship **MP3-only** first vs dual format from day one.
3. **SSML**: plain text only for MVP vs optional SSML for pauses and emphasis.
4. **Lambda memory / region**: values that meet **FR2.3-NFR01** on warm path.
5. **Deprecation of `voice_service.py`**: single cloud path vs dual local/cloud for desktop **main.py** demos.
