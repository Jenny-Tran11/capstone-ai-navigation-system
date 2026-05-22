# UAT Checklist — AI Navigation System Mobile App

**Session duration:** 60–90 minutes  
**Reference:** PRD §9.2 UAT Script / §14.4 (Ticket AWS-004)

---

## Session Metadata

| Field | Value |
|---|---|
| Build / APK version | |
| Device model & OS version | |
| Tester name | |
| Test date | |
| Environment | ☐ Staging &nbsp; ☐ Production |
| Facilitator | |

---

## Section 1 — APK Install

> **Prerequisites:** Android device with USB debugging enabled or a physical handset with "Install unknown apps" allowed for the browser/Files app.

| ID | Step | Expected Result | Pass ✓/✗ | Notes |
|---|---|---|---|---|
| 1.1 | Download the APK from the link provided by the facilitator | File downloads without error; progress indicator visible | | |
| 1.2 | Open the downloaded `.apk` file from the notification shade or Files app | Android prompts "Allow from this source?" or equivalent install dialog | | |
| 1.3 | Tap **Install** | Installation completes; "App installed" confirmation shown | | |
| 1.4 | Tap **Open** (or locate app in launcher) | App launches to the sign-in screen | | |
| 1.5 | Verify app icon and name appear correctly in the launcher | Icon and label match the expected branding | | |

---

## Section 2 — Sign-in Flow

> **Prerequisites:** Test account credentials provided by the facilitator (email + password).

| ID | Step | Expected Result | Pass ✓/✗ | Notes |
|---|---|---|---|---|
| 2.1 | On the sign-in screen, enter the test email address | Email field accepts input; keyboard displayed | | |
| 2.2 | Enter the test password | Password field masks characters with bullets | | |
| 2.3 | Tap **Sign In** | Loading indicator appears; no crash | | |
| 2.4 | Wait for authentication to complete | App navigates past the sign-in screen (onboarding or home) | | |
| 2.5 | Attempt sign-in with a wrong password | Error message displayed inline (e.g., "Incorrect username or password"); user remains on sign-in screen | | |
| 2.6 | Tap **Forgot password?** | Navigates to forgot-password screen with email input | | |
| 2.7 | Enter a valid email and tap **Send code** | Confirmation screen shown asking for 6-digit code + new password | | |
| 2.8 | Navigate back to sign-in without completing reset | Returns to sign-in screen; no crash | | |
| 2.9 | Sign in successfully with correct credentials | Home tab visible; navigation bar shows Home / Detect / History / Settings | | |

---

## Section 3 — Onboarding & Safety Disclaimer

> Complete this section only if the account has never completed onboarding (fresh install or reset account).

| ID | Step | Expected Result | Pass ✓/✗ | Notes |
|---|---|---|---|---|
| 3.1 | After first sign-in, observe the first onboarding screen | "Set your places" heading shown; Home and Work address fields visible | | |
| 3.2 | Tap the **Home** address field and type a partial address | Google Maps autocomplete suggestions appear in a dropdown | | |
| 3.3 | Select a suggestion from the dropdown | Address populates the Home field | | |
| 3.4 | Attempt to tap **Continue** without entering either Home or Work | Button remains disabled / no navigation occurs | | |
| 3.5 | Enter at least one address (Home or Work) | **Continue** button becomes enabled | | |
| 3.6 | Tap **Continue** | Preferences saved; app navigates to the Home tab | | |
| 3.7 | Verify a safety disclaimer or welcome message is shown at some point during onboarding | Disclaimer text is visible and readable | | |
| 3.8 | Confirm the disclaimer must be acknowledged before proceeding | A tap/confirmation required; cannot skip | | |

---

## Section 4 — Preference Update

> Navigate to **Settings** tab.

| ID | Step | Expected Result | Pass ✓/✗ | Notes |
|---|---|---|---|---|
| 4.1 | Open **Settings** tab | Settings screen loads with sections: Profile, Emergency Contact, Voice, Detection, Feedback, About, Account | | |
| 4.2 | Tap the **Display name** field under Profile and edit it | Keyboard appears; text is editable | | |
| 4.3 | Save the updated display name | Change persists after leaving and returning to Settings | | |
| 4.4 | Under **Emergency Contact**, enter a contact name and phone number | Fields accept input | | |
| 4.5 | Under **Voice**, drag the **Speech rate** slider (range 0.5×–2.0×) | Slider moves smoothly; value updates in real time | | |
| 4.6 | Change **Verbosity** to each option: Low / Medium / High | Selection highlights correctly | | |
| 4.7 | Change **TTS Language** (e.g., en-AU → en-US) | New value selected | | |
| 4.8 | Under **Detection**, drag the **Detection interval** slider (range 5–60 s) | Slider moves; value shown in seconds | | |
| 4.9 | Toggle **Haptic feedback** switch | Switch changes state visually | | |
| 4.10 | Navigate away from Settings and return | All changes are still reflected (preferences persisted to API) | | |
| 4.11 | Check the **About** section | App version shown; API status indicator is green (live) | | |

---

## Section 5 — Indoor Detection Task

> Navigate to the **Detect** tab. Ensure adequate indoor lighting. Facilitator will confirm the model service is running.

| ID | Step | Expected Result | Pass ✓/✗ | Notes |
|---|---|---|---|---|
| 5.1 | Open **Detect** tab | Camera permission prompt appears if not yet granted | | |
| 5.2 | Grant camera permission when prompted | Live camera feed visible; START button shown as a large circle | | |
| 5.3 | Tap **START** | Detection begins; interval counter or activity indicator visible | | |
| 5.4 | Point camera at a common indoor obstacle (chair, bag, person) | A bounding box or alert appears within one detection interval | | |
| 5.5 | Verify that a **DANGER** class object (person, stairs, step, curb, hazard) triggers a prominent alert | Alert text or TTS announcement heard / visible | | |
| 5.6 | Verify that a **MEDIUM** class object (bicycle, car, bus, truck) triggers a lower-priority alert | Different visual/audio treatment compared to DANGER | | |
| 5.7 | Observe the **scene description** text (if shown) | Readable description present alongside bounding boxes | | |
| 5.8 | Tap **STOP** | Detection halts; camera feed may freeze or clear | | |
| 5.9 | Resume by tapping **START** again | Detection resumes without requiring app restart | | |
| 5.10 | Check mode selector — switch to **Transit** mode | UI updates to bus-number reader mode | | |
| 5.11 | Point camera at a surface with numbers (any text) | Transit response returned; no crash | | |

---

## Section 6 — Outdoor Detection Task

> Conduct outdoors (street, footpath, or car park). Keep session ≤10 minutes.

| ID | Step | Expected Result | Pass ✓/✗ | Notes |
|---|---|---|---|---|
| 6.1 | Move to an outdoor environment and open **Detect** tab | Camera feed shows outdoor scene | | |
| 6.2 | Tap **START** | Detection begins | | |
| 6.3 | Walk slowly toward a kerb or step | Alert triggered before contact; TTS announces hazard | | |
| 6.4 | Walk in an area with passing vehicles | Vehicle detections appear in medium-priority alert band | | |
| 6.5 | Observe **crossing signal detection** — approach a pedestrian crossing | Crossing banner or announcement triggered (if crossing signal visible to camera) | | |
| 6.6 | Verify TTS speech rate matches the setting configured in Section 4 | Speech is noticeably faster/slower if slider was changed | | |
| 6.7 | Verify haptic feedback fires (if device supports it and toggle was enabled) | Device vibrates on each significant detection | | |
| 6.8 | Tap **STOP** and check **History** tab | At least one detection session entry recorded with timestamp | | |

---

## Section 7 — Error Identification Task

> The facilitator will simulate a service outage between steps 7.3 and 7.7.

| ID | Step | Expected Result | Pass ✓/✗ | Notes |
|---|---|---|---|---|
| 7.1 | Confirm detection is working (START → receive at least one result) | Successful detection displayed | | |
| 7.2 | Facilitator stops the model service (network cut or container stopped) | — | | |
| 7.3 | Wait for up to 3 consecutive detection failures | After 3 consecutive errors, app shows **"Detection paused — check API connection"** banner | | |
| 7.4 | Verify a **Retry** button or action is visible | Retry control visible and tappable | | |
| 7.5 | Read the error message aloud or note its text | Message is descriptive and non-technical (suitable for a user with low vision) | | |
| 7.6 | Tap **Retry** while the service is still down | Retry attempted; error persists gracefully without crash | | |
| 7.7 | Facilitator restores the model service | — | | |
| 7.8 | Tap **Retry** after service is restored | Detection resumes successfully; error banner clears | | |
| 7.9 | Sign out via **Settings → Account → Sign out** | Returned to sign-in screen; session cleared | | |

---

## Subjective Rating Questions

Ask the tester to rate each statement on a scale of **1 (strongly disagree) → 5 (strongly agree)** after completing all tasks.

| # | Statement | Rating (1–5) | Comments |
|---|---|---|---|
| Q1 | "I trust the alerts produced by the app to be timely and accurate." | | |
| Q2 | "The detection speed felt acceptable for real-world navigation." | | |
| Q3 | "I would use this app for a real trip in my daily environment." | | |

---

## Exit Criteria

| Criterion | Met? |
|---|---|
| Zero Priority-0 crashes (app termination, data loss, complete service failure) | ☐ Yes &nbsp; ☐ No |
| Two or fewer Priority-1 issues (major feature broken, no workaround) | ☐ Yes &nbsp; ☐ No |
| At least 2 out of 3 testers rate core journey (Q1–Q3) at 4/5 or above | ☐ Yes &nbsp; ☐ No |

---

## Issues Logged During Session

| # | Severity (P0/P1/P2/P3) | Section / ID | Description | Repro steps |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

---

## Sign-off

| Role | Name | Signature | Date |
|---|---|---|---|
| Tester | | | |
| Facilitator | | | |
| QA Lead | | | |
