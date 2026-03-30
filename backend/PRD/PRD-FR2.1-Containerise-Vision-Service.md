# PRD — FR2.1 Containerise Vision Service

**Parent document**: [PRD.md](./PRD.md) (Section 4 — Phase 2: AWS Cloud Deployment)  
**Feature ID**: FR2.1  
**Project**: Group 11 Capstone — AI-Assisted Navigation System for the Visually Impaired  
**Version**: 1.0  
**Last updated**: March 2026  

---

## 1. Summary

Package the server-side obstacle-detection stack (`vision_service.py`, Ultralytics YOLO, trained weights, and pinned Python dependencies) as an **OCI container image** so it can run consistently in development and deploy to AWS for GPU inference. The primary target in the parent PRD is **EC2 `g4dn.xlarge` (NVIDIA T4)**; an **alternate path** is a **Lambda-optimised** image using a smaller model variant when cost or ops constraints favour serverless.

---

## 2. Problem & outcome

| Item | Detail |
|------|--------|
| **Problem** | Local vision code is not reproducibly packaged for cloud; model weights and CUDA/PyTorch stacks are environment-specific. |
| **Desired outcome** | One build artifact (image) that builds on a developer machine, runs locally for smoke tests, and deploys to the chosen AWS compute with **server-side inference latency < 500 ms per image** on the target (aligned with [PRD.md](./PRD.md) NFR-1 and Success Metrics). |

---

## 3. Scope

### 3.1 In scope

- `Dockerfile`(s) and supporting build context (e.g. `.dockerignore`) for the vision workload.
- Inclusion of **application code** required for inference: at minimum `vision_service.py` and `config.py` (or equivalent configuration mechanism).
- Inclusion of **trained model weights** in the image **or** documented runtime fetch from S3 (see [PRD.md](./PRD.md) FR2.5) with identical behaviour after startup.
- **Pinned dependencies** (from FR1.4 `requirements.txt` or equivalent) installed inside the image.
- **Documented** `docker build` and `docker run` commands (including GPU flags where applicable).
- **HTTP service surface** inside the container sufficient to satisfy downstream integration with **POST `/detect`** (see FR2.4): accept an image payload, return JSON detections (and optional spatial text consistent with current `analyze_scene()` behaviour).
- Health/readiness endpoint (e.g. `GET /health`) so orchestrators can verify model load.

### 3.2 Out of scope (handled by other FRs)

- API Gateway wiring, auth, and multi-service routing (FR2.4).
- Navigation Lambda (FR2.2) and Polly TTS (FR2.3).
- Full CloudWatch dashboard setup (FR2.6) — *optional minimal logging hooks only if needed for latency verification*.

---

## 4. Dependencies & prerequisites

| Dependency | Notes |
|------------|--------|
| **FR1.4** | Stable `requirements.txt` (or `pyproject.toml`) with pinned versions used in the container build. |
| **FR1.1** (recommended for production path) | Trained weights (e.g. `best.pt`) and `config.py` / env reflecting **30-class** domain model; container must load the same weights the team validates in training. |
| **FR2.5** (optional) | Model in S3; container entrypoint downloads to local volume on start — reduces image size, adds startup time and IAM complexity. |

---

## 5. Functional requirements

| ID | Requirement |
|----|----------------|
| FR2.1-F01 | The repository contains a `Dockerfile` that builds without manual steps beyond documented build-args/secrets (e.g. no interactive prompts). |
| FR2.1-F02 | The image includes `vision_service.py` and all **import-time** dependencies (Ultralytics, OpenCV, PyTorch stack, etc.) required to run inference on a single image. |
| FR2.1-F03 | Model weights are available at runtime: **baked into the image** or **downloaded once at container start** from a configured URI (S3 per FR2.5). |
| FR2.1-F04 | Configuration (model path, confidence threshold, class filter) is overridable via **environment variables** or a mounted config file without rebuilding the image. |
| FR2.1-F05 | Container exposes a **network port** for HTTP inference and documents the request/response schema aligned with FR2.4 `/detect` (multipart or base64 JSON — team to pick one for MVP and document it here in implementation notes). |
| FR2.1-F06 | Container logs model load success/failure and a single-line per-request inference timing at **INFO** (or structured JSON) to support NFR latency measurement. |

---

## 6. Non-functional requirements

| ID | Category | Requirement |
|----|----------|-------------|
| FR2.1-NFR01 | **Latency** | On the **target deployment** (EC2 `g4dn.xlarge` with GPU, or approved Lambda container profile), **p95 warm inference** < **500 ms** per image for the agreed MVP resolution and model variant, measured server-side from request received to response sent. |
| FR2.1-NFR02 | **Cold start** | Document expected cold-start behaviour for the chosen target (EC2 process restart vs Lambda container init); if Lambda path is used, cold start must be understood and accepted by stakeholders (may exceed 500 ms — document separately from warm path). |
| FR2.1-NFR03 | **Image size** | Prefer multi-stage builds and `.dockerignore`; align with parent **NFR-7** cloud model < 50 MB where that refers to **weights**; full image may be larger but should be justified in implementation notes. |
| FR2.1-NFR04 | **Security** | No secrets in image layers; use build-args or runtime env from AWS Secrets Manager/Parameter Store as appropriate. Non-root user in container where compatible with GPU runtime. |

---

## 7. Deployment targets

### 7.1 Primary: EC2 `g4dn.xlarge` (NVIDIA T4)

- Base image: **NVIDIA CUDA**-compatible PyTorch or official Ultralytics GPU guidance.
- Runtime: Docker with **NVIDIA Container Toolkit** on the host.
- Evidence: `docker run --gpus all` (or orchestrator equivalent) successfully runs inference on a sample image.

### 7.2 Alternate: AWS Lambda (container package)

- Use **smaller** YOLO variant and/or quantised/exported model if required to meet Lambda **deployment package / ephemeral storage** limits.
- Document tradeoffs vs GPU EC2 (accuracy, latency, cold start).
- **Note**: Parent PRD FR2.0 describes a Lambda-only low-cost track; FR2.1 may **overlap** with FR2.0 when the “Lambda optimisations” path is chosen. The team should record which FR owns the **canonical** Lambda implementation to avoid duplicate handlers.

---

## 8. Acceptance criteria (release checklist)

Derived from [PRD.md](./PRD.md) §4 FR2.1, expanded for testability.

1. **Build**: `docker build` completes successfully on a clean clone (after placing or fetching weights per documented method).
2. **Run (CPU dev)**: `docker run` executes locally on a developer machine (CPU-only smoke test acceptable if documented; full latency target validated on GPU target).
3. **Run (GPU target)**: On EC2 `g4dn.xlarge` (or CI-equivalent GPU runner if available), sample batch demonstrates **warm** inference **< 500 ms** per image at the agreed input size, with measurement methodology recorded (e.g. averaged over N ≥ 30 requests after warmup).
4. **Contract**: Response JSON includes detection boxes, class names, confidences, and **spatial summary** consistent with current `ObjectDetector.analyze_scene()` semantics unless an explicit breaking change is approved in the parent PRD.
5. **Docs**: README or short `docs/vision-container.md` section lists build/run, env vars, ports, and troubleshooting (CUDA/driver mismatch).

---

## 9. Verification & metrics

| Check | Method |
|-------|--------|
| Correctness | Golden set of labelled test images; compare detection counts and key classes to baseline local run. |
| Latency | Script or load tool (e.g. `hey`, `k6`) against `/detect`; record p50/p95; push to CloudWatch custom metric when AWS deployment exists. |
| Regression | CI job builds image (no push) on each main-branch merge optional but recommended. |

---

## 10. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| GPU base images are large and slow to build | Multi-stage build; cache layers in CI; document minimal dev Dockerfile variant if useful. |
| PyTorch/CUDA version skew breaks Ultralytics | Pin versions in FR1.4 lockfile; pin base image digest in implementation. |
| Lambda limits block full YOLO stack | Explicit “small model” variant; or defer Lambda path and ship EC2 first. |
| Overlap/confusion with FR2.0 Lambda tasks | Single owner per deployment path; cross-link issues/PRs in project tracker. |

---

## 11. Traceability

| Parent reference | This PRD |
|------------------|----------|
| [PRD.md](./PRD.md) FR2.1 | Sections 1–3, 8 |
| [PRD.md](./PRD.md) FR2.4 `/detect` | §3.1, FR2.1-F05 |
| [PRD.md](./PRD.md) FR2.5 S3 weights | §4, FR2.1-F03 |
| [PRD.md](./PRD.md) NFR-1, NFR-7 | §2, §6 |
| [PRD.md](./PRD.md) §7.1 architecture (EC2 vision) | §7.1 |

---

## 12. Open decisions (to resolve before implementation)

1. **Single vs dual Dockerfile**: one GPU production Dockerfile plus optional CPU-only for CI, vs one parameterized build.
2. **Weights strategy**: bake `best.pt` into image vs download from S3 at boot (FR2.5).
3. **API shape**: multipart vs base64 JSON for mobile clients (must match FR2.4 final contract).
4. **Canonical owner** when both FR2.0 and FR2.1 target Lambda containers.
