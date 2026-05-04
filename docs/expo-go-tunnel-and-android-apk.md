# Expo Go over a custom domain and Android APK builds

This guide complements [vps-e2e-deployment.md](./vps-e2e-deployment.md). It covers:

1. Letting **Expo Go** on a phone reach your **Metro dev server** through a **stable public URL on your own domain** (instead of only LAN or Expo’s default tunnel hostnames).
2. Building an **Android APK** you can install without the Play Store.

---

## Part A — Expo Go and a custom domain (Metro tunnel)

### How Expo Go finds Metro

- `npx expo start` runs **Metro** (default port **8081**).
- Expo Go loads your JavaScript by opening a connection to that dev server (including **WebSockets** for hot reload).

You need a path from the phone to that process: same Wi‑Fi (LAN), USB, **Expo’s built‑in ngrok tunnel**, or **your own reverse proxy / tunnel** on a hostname you control.

### Option 1 — Built‑in tunnel (no custom domain)

Expo can tunnel Metro through ngrok:

```bash
npm i -g @expo/ngrok
cd apps/mobile
pnpm exec expo start --tunnel
```

You get a public URL like `https://xxxxxxx.bacon.19000.exp.direct:80` (see [Expo CLI — Tunneling](https://docs.expo.dev/more/expo-cli/#tunneling)). This is **not** your own domain, but it is the quickest way to test from cellular data or restrictive networks.

Optional: `EXPO_TUNNEL_SUBDOMAIN` can influence the tunnel hostname on `exp.direct` (experimental; can affect `expo-linking` / Expo Go).

### Option 2 — Custom domain (Cloudflare Tunnel or similar)

Use this when you want something like `https://metro.example.com` to terminate in front of Metro on your laptop or a build machine.

**Requirements**

- DNS for `metro.example.com` (or a subdomain you choose) points at your tunnel (e.g. Cloudflare Tunnel / `cloudflared`).
- The tunnel forwards **HTTP** to Metro, typically `http://127.0.0.1:8081`.
- The proxy must support **WebSocket** upgrades (Cloudflare proxy does, when configured normally for HTTP to origin).

**1. Start Metro on a fixed port (default 8081 is fine)**

```bash
cd apps/mobile
pnpm exec expo start --port 8081
```

Use **LAN** or **localhost** mode for the machine that runs Metro; the phone will **not** use the LAN IP if you override the public URL in step 3.

**2. Point your tunnel at Metro**

Example idea (adjust to your tunnel product): a public hostname `https://metro.example.com` → origin `http://127.0.0.1:8081`.

**3. Tell Expo CLI the public URL clients should use**

Expo documents `EXPO_PACKAGER_PROXY_URL` so the dev server advertises a URL you choose instead of localhost/LAN:

```bash
export EXPO_PACKAGER_PROXY_URL=https://metro.example.com
cd apps/mobile
pnpm exec expo start --port 8081
```

See [Expo CLI — `EXPO_PACKAGER_PROXY_URL`](https://docs.expo.dev/more/expo-cli/#tunneling) (same section as tunneling). The CLI may show an `exp://…` URL derived from that host; scan it with **Expo Go**.

**Caveats**

- Anyone who can reach that URL might reach your dev server; use auth, IP allowlists, or short‑lived tunnels in production‑like networks.
- TLS certificate and WebSocket behavior depend on the tunnel; if the app fails to connect, verify WebSockets end‑to‑end (browser devtools or `wscat` against your tunnel URL).
- If you change hostname or port, restart Metro and update `EXPO_PACKAGER_PROXY_URL` accordingly.

### APIs on another host

Tunneling **only Metro** does not expose your **REST API** or **model** service. The mobile app still needs reachable `EXPO_PUBLIC_*` URLs (see the VPS doc). Typical setups: API on `https://api.example.com` (already tunneled or on a VPS) and Metro on `https://metro.example.com`.

---

## Part B — Android APK (not the same as “Expo Go APK”)

- **Expo Go** is a generic client from the store; you do **not** build an APK *of Expo Go* for your project. You install Expo Go and scan the dev QR / open the dev URL.
- An **APK of your app** is a **standalone native binary** that embeds your JS bundle (and native code). You usually create it with **EAS Build** or a **local Gradle release build**.

### Prerequisites (EAS, recommended)

1. [Expo account](https://expo.dev/) and [EAS CLI](https://docs.expo.dev/build/setup/):

   ```bash
   npm i -g eas-cli
   eas login
   ```

2. From the mobile app directory, link the project once:

   ```bash
   cd apps/mobile
   eas build:configure
   ```

   That creates `eas.json` and registers the app if needed.

### APK for internal testing (EAS)

Google Play often wants an **AAB** for store uploads; an **APK** is convenient for sideloading / QA.

In `eas.json`, use a profile with Android `buildType` set to `apk`, for example:

```json
{
  "cli": {
    "version": ">= 16.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

Then:

```bash
cd apps/mobile
eas build -p android --profile preview
```

When the build finishes, download the **APK** from the Expo dashboard and install it on a device (enable “Install unknown apps” for your browser / file manager as required).

Notes:

- **`preview`** above produces a **release**-style binary for sideloading, not necessarily a “development client” unless you add `developmentClient` / use the `development` profile per [EAS docs](https://docs.expo.dev/build/introduction/).
- If you use **`expo-dev-client`**, a **development build** is a separate artifact from “Expo Go”; install that APK for dev features, or use Expo Go for pure managed workflow without custom native modules.

### Local release APK (advanced)

If you have Android SDK / NDK configured and prefer not to use EAS for a one‑off build:

```bash
cd apps/mobile
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

The APK is typically under `android/app/build/outputs/apk/release/`. You maintain the `android/` tree after prebuild (or regenerate with care). Prefer **EAS** unless you have a reason to build locally.

---

## Quick reference

| Goal | Approach |
|------|----------|
| Phone on different network, no custom domain | `pnpm exec expo start --tunnel` (with `@expo/ngrok` installed globally) |
| Stable URL on **your** domain to Metro | Tunnel hostname → `127.0.0.1:8081` + `EXPO_PACKAGER_PROXY_URL=https://…` + `expo start --port 8081` |
| Installable Android binary of **this** app | `eas build -p android` with a profile that sets `"android": { "buildType": "apk" }` for APK, or AAB for Play Store |

For backend + model + API on a VPS and Cloudflare, keep using [vps-e2e-deployment.md](./vps-e2e-deployment.md).
