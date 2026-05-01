# Adding an Expo Mobile App

This guide explains how to add an Expo 55 React Native app to this monorepo alongside the existing `apps/admin` and `apps/web` applications.

---

## 1. Scaffold the app

```bash
cd apps
npx create-expo-app@latest mobile --template blank-typescript
```

This creates `apps/mobile/`. The app name in `app.json` should be updated to match your project.

---

## 2. Register in pnpm workspace

Add `apps/mobile` to `pnpm-workspace.yaml` (it already covers `apps/*`, so no change needed if you used that path). Verify:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'commands/*'
```

Run `pnpm install` from the monorepo root to link workspace packages.

---

## 3. Update `apps/mobile/package.json`

Add the shared packages as dependencies:

```json
{
  "name": "@baseline/mobile",
  "dependencies": {
    "@baseline/client-api": "workspace:1.0.0",
    "@baseline/swr-user": "workspace:1.0.0",
    "@baseline/types": "workspace:1.0.0",
    "@baseline/utils": "workspace:1.0.0"
  }
}
```

Then run `pnpm install` again from the root.

---

## 4. Configure Metro to resolve workspace packages

Create or update `apps/mobile/metro.config.js`:

```js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// Resolve modules from the monorepo root first
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
```

---

## 5. TypeScript path aliases

Create `apps/mobile/tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@baseline/client-api/*": ["../../packages/client-api/*"],
      "@baseline/swr-user/*": ["../../packages/swr-user/*"],
      "@baseline/types/*": ["../../packages/types/*"],
      "@baseline/utils/*": ["../../packages/utils/*"]
    }
  }
}
```

---

## 6. NativeWind (Tailwind for React Native)

Install NativeWind v4 for Tailwind utility classes on React Native:

```bash
pnpm --filter @baseline/mobile add nativewind tailwindcss
pnpm --filter @baseline/mobile add -D babel-plugin-nativewind
```

Create `apps/mobile/tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Update `apps/mobile/babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

Add to `apps/mobile/global.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Import in your root `_layout.tsx`:

```tsx
import './global.css';
```

---

## 7. Sharing SWR hooks

The `@baseline/swr-user` package works on React Native without modification — SWR is platform-agnostic and `@baseline/client-api` uses axios, which works in React Native.

Example usage in `apps/mobile/app/index.tsx`:

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useWorkspacesUser } from '@baseline/swr-user/workspace';

export default function HomeScreen() {
  const { workspaces, isLoading } = useWorkspacesUser();

  if (isLoading) return <Text>Loading...</Text>;

  return (
    <View className="flex-1 items-center justify-center bg-white">
      {workspaces?.map((ws) => (
        <Text key={ws.workspaceId} className="text-lg font-bold">
          {ws.name}
        </Text>
      ))}
    </View>
  );
}
```

---

## 8. Auth with Amplify

Install Amplify for React Native:

```bash
pnpm --filter @baseline/mobile add aws-amplify @aws-amplify/react-native
pnpm --filter @baseline/mobile add @react-native-community/netinfo @react-native-async-storage/async-storage
```

Configure Amplify identically to the web apps, using `EXPO_PUBLIC_` prefixed env vars instead of `VITE_`:

```ts
// apps/mobile/src/lib/amplify.ts
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_WEB_CLIENT_ID!,
    },
  },
});
```

---

## 9. EAS Build

Install the EAS CLI and initialise builds:

```bash
npm install -g eas-cli
cd apps/mobile
eas init
eas build:configure
```

Create `apps/mobile/eas.json`:

```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

Build commands:

```bash
# Development build (includes dev client)
eas build --profile development --platform all

# Production build
eas build --profile production --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## 10. Root scripts

Add to the root `package.json`:

```json
{
  "scripts": {
    "start:mobile": "pnpm --filter @baseline/mobile run start",
    "build:mobile:ios": "pnpm --filter @baseline/mobile run eas build --platform ios",
    "build:mobile:android": "pnpm --filter @baseline/mobile run eas build --platform android"
  }
}
```

---

## Summary

| Layer | Technology |
|-------|-----------|
| Framework | Expo 55 (React Native) |
| Styling | NativeWind v4 (Tailwind) |
| Auth | AWS Amplify for React Native |
| Data fetching | SWR via `@baseline/swr-user` |
| API calls | axios via `@baseline/client-api` |
| Types | `@baseline/types` |
| Utilities | `@baseline/utils` |
| Builds | EAS Build (iOS + Android) |
| Monorepo | pnpm workspaces + Metro resolver |
