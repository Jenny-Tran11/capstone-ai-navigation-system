# Future Implementation TODO

This document tracks future functions and product work for the AI navigation system. Keep items unchecked until the feature is implemented, tested, and documented.

## Admin App

- [ ] Add an admin user management page for listing all users.
- [ ] Add user detail view with profile, account status, permissions, workspaces, and detection activity.
- [ ] Add admin actions to enable, disable, or delete a user account.
- [ ] Add admin action to reset a user's password or trigger a password reset email.
- [ ] Add admin action to update a user's display name, email metadata, and accessibility profile.
- [ ] Add filters and search for users by email, name, role, status, and workspace.
- [ ] Add pagination for large user lists.
- [ ] Add audit logs for admin actions, including who changed what and when.
- [ ] Add confirmation dialogs for destructive user and detection actions.
- [ ] Add a user preferences management page for reviewing and editing saved preferences.
- [ ] Add validation UI for preference values such as speech rate, detection interval, scan limits, and feedback modes.
- [ ] Add read-only analytics for detection usage, failed requests, model confidence, and active users.
- [ ] Add model service status page showing health, model version, uptime, and last successful detection.
- [ ] Add admin dashboard cards for users, detections, API errors, and model availability.

## API

- [ ] Define a user profile data model shared by API, admin, mobile, and packages.
- [ ] Implement authenticated endpoint for users to get their own profile.
- [ ] Implement authenticated endpoint for users to update their own profile.
- [ ] Implement authenticated endpoint for users to get their own preferences.
- [ ] Implement authenticated endpoint for users to update their own preferences.
- [ ] Implement default preference creation when a user signs in for the first time.
- [ ] Implement admin endpoint to list users.
- [ ] Implement admin endpoint to get one user's full profile.
- [ ] Implement admin endpoint to update a user's profile metadata.
- [ ] Implement admin endpoint to enable or disable user accounts through Cognito.
- [ ] Implement admin endpoint to delete or deactivate users safely.
- [ ] Implement admin endpoint to manage user preferences.
- [ ] Implement admin endpoint to list a user's detection history.
- [ ] Add request validation schemas for user profile and preference payloads.
- [ ] Add authorization checks so users can only read and write their own data.
- [ ] Add admin-only permission checks for all user management routes.
- [ ] Add API error responses that mobile and admin can display consistently.
- [ ] Add API tests for user profile, preference, detection, and admin routes.
- [ ] Add rate limiting or request throttling for detection requests.
- [ ] Add server-side enforcement for max scans per hour.
- [ ] Add structured logs for user actions, detection requests, and model failures.

## Mobile App

- [ ] Replace local-only preferences with API-backed user preferences.
- [ ] Sync preferences after sign-in and persist offline changes when the device reconnects.
- [ ] Add account/profile screen for name, email, password reset, and sign out.
- [ ] Add onboarding flow for camera permission, voice output, haptics, and detection safety.
- [ ] Add navigation mode with start, pause, resume, and stop states.
- [ ] Add route planning UI for origin, destination, route preview, and route steps.
- [ ] Add voice guidance for detected obstacles and navigation instructions.
- [ ] Add background-safe detection behavior when the app is paused or screen is locked.
- [ ] Add detection history screen with timestamps, scene descriptions, and detected objects.
- [ ] Add clear error states for missing API URL, missing model service, invalid API key, and network timeout.
- [ ] Add retry behavior for temporary model/API failures.
- [ ] Add adjustable detection settings for scan interval, max scans per hour, confidence threshold, speech rate, verbosity, and haptics.
- [ ] Add accessibility labels, larger touch targets, and screen reader support across all screens.
- [ ] Add low vision friendly theme options, including high contrast and large text.
- [ ] Add battery and data usage warnings for live detection.
- [ ] Add offline fallback messaging when detection or navigation cannot run.
- [ ] Add mobile tests for auth flow, settings updates, detection API calls, and navigation screens.

## Model Service

- [ ] Add model version metadata to `/health`.
- [ ] Add confidence threshold configuration per request or per user preference.
- [ ] Add response fields for object position, distance estimate, urgency level, and recommended action.
- [ ] Improve scene description logic for navigation-friendly messages.
- [ ] Add class filtering so the app can prioritize hazards such as vehicles, people, curbs, stairs, poles, and obstacles.
- [ ] Add tests for image decoding, invalid payloads, API key handling, and detection response shape.
- [ ] Add benchmark script for latency, memory usage, and throughput.
- [ ] Add model warm-up on startup to reduce first-request latency.
- [ ] Add structured model logs for request duration, detection count, confidence distribution, and errors.
- [ ] Add optional GPU support documentation and configuration.
- [ ] Add model training workflow documentation for dataset preparation, Roboflow export, training, validation, and weight deployment.
- [ ] Add evaluation metrics tracking for precision, recall, mAP, false positives, and false negatives.
- [ ] Add safety review dataset focused on real pedestrian navigation scenarios.
- [ ] Add fallback response when model confidence is too low.
- [ ] Add endpoint or script to verify the configured `.pt` weights before deployment.

## Shared Packages and Infrastructure

- [ ] Add shared TypeScript types for user profile, preferences, detection records, and model health.
- [ ] Add API client functions for user profile, preferences, admin user management, and model status.
- [ ] Add SWR or query hooks for admin user lists, user details, preferences, and detection history.
- [ ] Add database table or access pattern for user preferences.
- [ ] Add database indexes needed for admin user lookup and detection history.
- [ ] Add infrastructure for environment-specific model API URLs and API keys.
- [ ] Add secret management for model API keys instead of committing or sharing raw values.
- [ ] Add deployment checks that verify API, admin, mobile config, and model service health.
- [ ] Add CI checks for TypeScript, Python model tests, linting, and formatting.
- [ ] Add documentation for local development with API, mobile, admin, and model running together.

## Product and Safety

- [ ] Define MVP acceptance criteria for detection, navigation, settings, and admin management.
- [ ] Define safety boundaries explaining that the app assists navigation but does not replace mobility aids.
- [ ] Add privacy policy notes for camera images, detection history, user preferences, and account data.
- [ ] Decide whether detection images are stored, discarded immediately, or stored only with explicit consent.
- [ ] Add consent controls for analytics and detection history retention.
- [ ] Add data retention policy for users, preferences, detections, logs, and audit events.
- [ ] Add manual QA checklist for real-device camera testing.
- [ ] Add field testing checklist for outdoor, indoor, low-light, crowded, and noisy environments.
- [ ] Add release checklist for staging, production, VPS model deployment, and mobile build submission.
