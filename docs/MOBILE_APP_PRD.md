# Product Requirements Document — Mobile App (AI-Assisted Navigation)

**Product:** BlindNav Mobile (working title)  
**Platform:** iOS & Android via Expo (React Native)  
**Document version:** 1.0  
**Last updated:** 2025-03-23  

---

## 1. Executive summary

BlindNav Mobile is the primary end-user client for the **AI-Assisted Navigation System for the Visually Impaired**. It combines **turn-by-turn navigation**, **camera-based hazard and landmark detection** (via the existing AWS Lambda detection API), **high-contrast and screen-reader–first UX**, and **safety features** so users can move independently with clearer spatial awareness.

This PRD describes a **full-featured v1.0** scope. Implementation may ship in phased releases; priorities are called out in §10.

---

## 2. Problem statement

People with low vision or blindness often lack timely, **plain-language descriptions** of obstacles, signage, and crossings at the moment they matter. Generic map apps optimize for sighted users and may not integrate **continuous environmental understanding** with **accessible navigation**. This product closes that gap by pairing standard routing with **on-demand or periodic AI scene interpretation** backed by the project’s detection service.

---

## 3. Goals and non-goals

### 3.1 Goals

- Deliver **WCAG-minded, VoiceOver/TalkBack–first** flows for all core tasks.
- Integrate **POST /detect** (or equivalent) for image-based detection with clear latency and error handling.
- Provide **reliable outdoor navigation** (walking) with audio and haptic cues.
- Support **offline-tolerant** behavior where feasible (cached routes, last-known guidance, queued requests).
- Meet **privacy and safety** expectations (explicit camera use, data minimization, emergency contacts).

### 3.2 Non-goals (v1.0)

- Replacing certified medical or orientation & mobility training.
- Full indoor positioning / BLE beacon mapping (may be a future epic).
- Training or hosting custom models on-device (inference remains server-side unless explicitly added later).
- Real-time video streaming to the cloud for continuous monitoring (batch/still capture only unless policy changes).

---

## 4. Target users and personas

| Persona | Needs | Success looks like |
|--------|--------|---------------------|
| **Primary — blind/low-vision pedestrian** | Voice-first UI, predictable gestures, obstacle context | Confident short trips; fewer unexpected collisions |
| **Secondary — sighted companion** | Quick visual map; shared live trip | Can assist without taking over the device |
| **Tertiary — O&M professional / caregiver** | Simple setup, audit of settings | Trust in defaults and safety features |

---

## 5. Assumptions and dependencies

- **Backend:** API Gateway + Lambda detection endpoint is deployed; mobile uses `EXPO_PUBLIC_DETECT_API_URL` and `EXPO_PUBLIC_DETECT_API_KEY`.
- **Device:** Camera, GPS, magnetometer (heading), network (Wi‑Fi/cellular); haptics where available.
- **Maps:** Licensed map/routing SDK or REST service (e.g. provider TBD by engineering); PRD assumes walking directions, not driving-only APIs.
- **Compliance:** App Store / Play policies for camera, location, and background location (if used) are satisfied.

---

## 6. Functional requirements

### 6.1 Onboarding and account (optional but specified)

- **FR-ONB-1:** First-launch flow: welcome, permissions rationale (location, camera, notifications), and haptic/voice quick test.
- **FR-ONB-2:** Optional sign-in (email/OAuth) for **syncing favorites, emergency contacts, and preferences** across devices.
- **FR-ONB-3:** Guest mode: full navigation + detection without account; data stays on device.

### 6.2 Home and “Go” experience

- **FR-HOME-1:** **“Where to?”** search (addresses, POIs, saved places) with voice input where OS allows.
- **FR-HOME-2:** One-tap **“Detect surroundings”** from home (opens camera capture flow).
- **FR-HOME-3:** **Recent destinations** and **saved places** surfaced on home.

### 6.3 Navigation (core)

- **FR-NAV-1:** Request **walking route** between user location and destination; show **step list** and **map** (for low-vision users: large type, high contrast).
- **FR-NAV-2:** **Turn-by-turn guidance**: spoken instructions, distance to next maneuver, street names, and **off-route recalculation**.
- **FR-NAV-3:** **Heading / orientation cues** (e.g. “facing northwest”) to reduce wrong-way starts.
- **FR-NAV-4:** **Arrival detection** and summary (“You have arrived near …”).
- **FR-NAV-5:** **Trip sharing** (time-limited link or live ETA) for companions.

### 6.4 AI detection (camera + API)

- **FR-DET-1:** Capture **still image** or short **burst** (configurable); compress and send to detection API with timeout (e.g. 15–30s configurable).
- **FR-DET-2:** Present results as **spoken summary** first; optional **detailed list** (object labels, rough direction if model provides it).
- **FR-DET-3:** **Retry** and **“slower network”** messaging; no silent failures.
- **FR-DET-4:** **Rate limiting** UX when API returns 429; local queue for later retry if user opts in.
- **FR-DET-5:** **Privacy toggle:** require **double-tap or voice confirm** before upload when enabled.

### 6.5 Safety and SOS

- **FR-SOS-1:** **Emergency action**: hold button or voice phrase triggers **call emergency number** (region-aware) and optionally **SMS location** to emergency contacts.
- **FR-SOS-2:** User-configured **ICE contacts** and **medical notes** (stored encrypted at rest if account exists).
- **FR-SOS-3:** **Fake cancel** protection: optional countdown with spoken cancel instruction.

### 6.6 Places and personalization

- **FR-PLC-1:** Save **home**, **work**, and custom favorites with voice-friendly names.
- **FR-PLC-2:** **Avoid stairs / prefer curb cuts** when routing API supports it (feature flag).
- **FR-PLC-3:** **Route preferences**: “fewer crossings,” “well-lit” (proxy via main roads if data available).

### 6.7 Settings and accessibility

- **FR-SET-1:** **Voice profile**: speech rate, verbosity (brief vs detailed), language.
- **FR-SET-2:** **Visual themes**: high contrast, font scaling, reduce motion.
- **FR-SET-3:** **Haptics** on/off and intensity.
- **FR-SET-4:** **Detection frequency** caps to manage cost and battery.
- **FR-SET-5:** **Data & privacy** screen: clear explanation of what is sent to the server and retention (as per backend policy).

### 6.8 Offline and degraded modes

- **FR-OFF-1:** If offline: **block new detection** with explanation; **allow** viewing last results and saved places.
- **FR-OFF-2:** If offline mid-route: use **last downloaded steps** where possible; prompt when back online to refresh.
- **FR-OFF-3:** Optional **download offline map region** (provider-dependent; may be phase 2).

### 6.9 Notifications

- **FR-NOT-1:** Optional alerts for **arriving at transit stop** (if transit added later) — out of scope for walking-only v1 unless already bundled with map SDK.
- **FR-NOT-2:** **Battery low** warning during active navigation with suggestion to open power-saving mode.

### 6.10 Analytics and diagnostics (privacy-preserving)

- **FR-LOG-1:** Opt-in **anonymous telemetry**: screen time per feature, crash logs, API latency buckets (no raw images).
- **FR-LOG-2:** **Export diagnostic bundle** for support (user-initiated).

---

## 7. Non-functional requirements

| ID | Category | Requirement |
|----|-----------|-------------|
| NFR-1 | Accessibility | All interactive controls reachable and labeled; focus order logical; no information by color alone. |
| NFR-2 | Performance | Cold start to “ready to navigate” ≤ 5s on mid-range device (target). |
| NFR-3 | Performance | Detection round-trip P95 ≤ 8s on good LTE when image ≤ 1MB (depends on backend). |
| NFR-4 | Reliability | Graceful degradation when GPS poor; explicit “accuracy low” announcements. |
| NFR-5 | Security | API keys not embedded in screenshots; use env/build config; certificate pinning considered for production. |
| NFR-6 | Battery | Background location only when actively navigating; document impact in settings. |

---

## 8. User journeys (summary)

1. **Commute:** Open app → voice search “coffee shop” → start navigation → periodic “scan ahead” before crossing → arrive.
2. **Unfamiliar crossing:** Pause navigation → capture scene → hear “crosswalk visible to your right” → proceed → resume.
3. **Distress:** Trigger SOS → countdown → call + SMS contacts with location.

---

## 9. Success metrics (v1 launch)

- **Task success rate:** % of test users completing a scripted route without critical assist (target TBD with research).
- **Detection usefulness:** subjective score ≥ 4/5 in pilot (n ≥ 10).
- **Crash-free sessions:** ≥ 99.5% over 30 days.
- **API error visibility:** 100% of failed detections show a user-understandable message + retry path.

---

## 10. Phased delivery (suggested)

| Phase | Scope |
|-------|--------|
| **MVP** | Onboarding, permissions, home, walking nav, detection capture + API, settings (voice/contrast), basic SOS |
| **v1.1** | Account sync, favorites, trip sharing, telemetry opt-in |
| **v1.2** | Offline map packs, richer routing preferences, localization |

---

## 11. Open questions

- Map/routing vendor and licensing for walking + accessibility attributes.
- Whether detection API will return structured fields (e.g. bearing hints) for richer audio UX.
- Regional emergency numbers and legal obligations for SOS features.
- Background location justification text for store review.

---

## 12. Glossary

- **O&M:** Orientation and mobility (professional training for travel with vision loss).
- **ICE:** In case of emergency (contacts/medical info).
- **POI:** Point of interest.

---

*This PRD is a planning artifact for the capstone monorepo (`apps/mobile`). Engineering tickets should trace to FR/NFR IDs above.*
