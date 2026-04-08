# Mobile app (Expo)

React Native app using **Expo SDK 55**, **NativeWind v4** (Tailwind for RN), and **shadcn-style** patterns via `class-variance-authority` + **@rn-primitives/slot**-friendly structure (see [React Native Reusables](https://reactnativereusables.com/) for more components).

**Navigation:** React Navigation wraps the app (`NavigationContainer` → native stack → bottom tabs). After Expo’s splash, users see **onboarding** first; **Get started** enters the main app (in-memory only until MOB-003 persists completion). Main tabs are **Home**, **Navigate**, **Detect**, and **Settings**—currently placeholders wired for accessibility labels and later features.

## Prerequisites

- Node.js 20+
- iOS Simulator (macOS) or Android emulator / physical device + Expo Go

## Install

From the **repository root**:

```bash
npm install
```

## Environment

Copy `.env.example` to `.env` and set:

- **Detection:** `EXPO_PUBLIC_DETECT_API_URL`, `EXPO_PUBLIC_DETECT_API_KEY` (`x-api-key` for REST `/detect`).
- **Users (optional until you wire auth):** `EXPO_PUBLIC_USER_API_URL`, `EXPO_PUBLIC_COGNITO_*`, `EXPO_PUBLIC_AWS_REGION` — values from **BlindNavUserApiStack** outputs (`UserHttpApiUrl`, pool id, client id, issuer, region).

See [`lib/env.ts`](lib/env.ts) (`isDetectConfigured`, `isUserApiConfigured`). Restart `expo start` after changing `.env`.

## Run

From repo root:

```bash
npm run mobile
```

Or from this folder:

```bash
npx expo start
```

Then press `a` / `i` for Android / iOS.

## More UI components

To scaffold additional primitives with the official CLI (optional):

```bash
cd apps/mobile
npx @react-native-reusables/cli@latest init
```

Follow the wizard; you already have NativeWind + Tailwind configured here.

## Project layout

- `navigation/` — `RootNavigator` (onboarding vs main), `MainTabs`
- `screens/` — tab screens + onboarding + shared `PlaceholderScreen`
- `context/OnboardingContext.tsx` — onboarding completion (placeholder for MOB-003 storage)
- `components/ui/` — reusable UI (e.g. `button.tsx`)
- `lib/env.ts` — public env helpers
- `lib/utils.ts` — `cn()` for class merging
- `global.css` — Tailwind entry (imported from `index.ts`)
