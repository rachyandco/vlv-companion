# Vlv Companion

A degoogled-friendly **React Native Android** client for the [Volvo Cars public API](https://developer.volvocars.com/apis/) — Connected Vehicle v2, Energy v2, and Location v1. Designed for phones running GrapheneOS, /e/OS, CalyxOS, LineageOS-without-GApps, etc. **No Firebase, no Google Play services, no Google Maps.**

> **Independent project — not affiliated.** Vlv Companion is an independent open-source project. It is not affiliated with, endorsed by, sponsored by, certified by, or otherwise authorised by Volvo Car Corporation, AB Volvo, Volvo Car USA, LLC, the Volvo Trademark Holding AB, or any other Volvo company. The names "VOLVO", the Volvo iron-mark, and any related marks are trademarks of their respective owners and are referenced here only to factually describe the vehicles and developer APIs this software interoperates with. See [`TRADEMARKS.md`](TRADEMARKS.md) for the full notice.

## Features

- OAuth 2.0 + PKCE sign-in against Volvo ID (EU region), confidential-client.
- Garage list with per-vehicle name + EV toggle (hides fuel UI on BEVs).
- Per-vehicle screens:
  - **Overview** — central lock, battery %, electric range, odometer, fuel (ICE only), service distance, doors top-view, **per-corner tyre pressure**.
  - **Energy** — battery gauge, charging status, target SoC, charging power, time-to-target, current limit.
  - **Location** — MapLibre + OpenFreeMap tiles, "Open in maps" handoff to OsmAnd / Organic Maps / Magic Earth via `geo:lat,lng`. Optional EV-charger overlay (OpenStreetMap Overpass).
  - **Commands** — lock, lock with reduced guard, unlock (with the `readyToUnlock` countdown banner), honk, flash, honk-and-flash, climatisation start/stop, engine start (1–15 min) / stop.

## Stack

- Expo SDK 53 + `expo prebuild` (bare Android folder, no Expo Go runtime).
- TypeScript, expo-router, TanStack Query, ky, Zustand.
- `@maplibre/maplibre-react-native` for the map.
- `expo-auth-session` + `expo-web-browser` for OAuth — uses your system browser (Mull / Vanadium / Fennec on degoogled phones), no GMS.

ESLint blocks any import of `@react-native-firebase/*`, `expo-notifications`, `react-native-maps`, `@react-native-google-signin/*`, and `expo-location` to keep the dependency graph degoogle-clean.

## Prerequisites

You need three things before the app can fetch any data:

### 1. Pair your car with your Volvo ID

The Volvo API only sees cars that are linked to your Volvo ID account. How you link depends on the model:

- **Newer cars with Google built-in (XC40 Recharge, C40, EX30, EX90, …)** — open the **Settings** app on the car's centre screen → **Profiles** → sign in with your Volvo ID. The car is then registered to that account automatically.
- **Older cars with Sensus** — install the official **Volvo Cars** app on a phone (just for the pairing — you don't need to keep using it). Sign in with the same Volvo ID, tap **Add a car**, and follow the in-app instructions (VIN entry + a verification step done from the car's centre screen).

Confirm the pairing worked: at <https://www.volvocars.com/>, the car must appear in your account. If it does not, the developer API will return an empty vehicle list no matter what you do in this app.

### 2. Create and **publish** a developer application

1. Go to <https://developer.volvocars.com> and click **Sign in** — use your Volvo ID (the same one your car is paired with).
2. Open the developer dashboard → **Create application**.
3. Fill in:
   - **Name** — anything.
   - **Redirect URI** — you need an HTTPS bridge that re-deeplinks back into the app, because the Volvo developer portal does not accept custom-scheme URIs. Host the static page at [`redirect/index.html`](redirect/index.html) on any HTTPS endpoint (Cloudflare Pages, GitHub Pages, Vercel, Netlify) and use that URL here. The page receives `?code=&state=` from Volvo and 302s to `volvo-companion://oauth/callback?…` so the app's intent-filter catches the response.
   - **Scopes** — request all `conve:*`, all `energy:*`, and `location:read`. The full list this app uses is in [`src/auth/config.ts`](src/auth/config.ts) (`DEFAULT_SCOPES`).
4. Click **Publish**, and take note of the **client id**, **client secret**.
5. From the application page note the **VCC API Key**. The VCC-API-Key is a separate header credential, not the OAuth secret — make sure you copy both.

### 3. (One-time) host the redirect bridge

Deploy [`redirect/index.html`](redirect/index.html) to any HTTPS host:

- **Cloudflare Pages** — drag the `redirect/` folder into a new project at dash.cloudflare.com → Pages.
- **GitHub Pages** — push `redirect/index.html` to a `gh-pages` branch and turn on **Pages → Deploy from branch**.
- **Vercel / Netlify** — `vercel deploy redirect/` or `netlify deploy --dir=redirect`.

The URL of that page is what you put in the Volvo portal *and* in the app's Settings → Redirect URI.

## Build

```bash
pnpm install
pnpm prebuild           # one-time: generates android/
```

Run on a connected device:

```bash
pnpm android            # debug build, installs on the device
pnpm android:release    # release variant
```

Or build a redistributable APK directly:

```bash
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

If `VOLVO_RELEASE_STORE_FILE` (and the matching `_PASSWORD`/`_ALIAS`/`_KEY_PASSWORD`) Gradle properties are unset, the APK is signed with Expo's debug keystore — fine for sideloading on your own device, **not** for redistribution. To produce a release-signed APK, drop a keystore at `android/app/release.keystore` and put the credentials in `~/.gradle/gradle.properties`:

```
VOLVO_RELEASE_STORE_FILE=release.keystore
VOLVO_RELEASE_KEY_ALIAS=vlv-companion
VOLVO_RELEASE_STORE_PASSWORD=...
VOLVO_RELEASE_KEY_PASSWORD=...
```

The CI release workflow rejects pushes when `RELEASE_KEYSTORE_BASE64` (plus the three password/alias secrets) are missing, so a tagged release can never publish a debug-signed APK.

> **`expo prebuild` and customisations.** Edits to `android/app/build.gradle` (e.g. the `signingConfigs.release` block) and to `android/gradle.properties` survive `pnpm prebuild --no-install` (the variant CI runs). Edits to `AndroidManifest.xml`, by contrast, are re-emitted from Expo's templates each prebuild — so `allowBackup="false"` is enforced via the config plugin in [`app.config.ts`](app.config.ts) rather than by editing the manifest directly. `pnpm prebuild --clean` rewrites the entire `android/` tree; if you ever need that, re-apply the build.gradle/gradle.properties diffs afterwards.

### About the API types

`src/api/types.connected-vehicle.gen.ts`, `types.energy.gen.ts`, and `types.location.gen.ts` are committed to the repo and re-imported as `@/api/types`. They were originally generated from Volvo's published OpenAPI specs but the specs themselves are **not** redistributed with this project — they remain Volvo Cars' intellectual property and you can fetch the current versions from <https://developer.volvocars.com/apis/>. If Volvo updates their schemas you can regenerate the local `*.gen.ts` files with `npx openapi-typescript <spec.json> -o <out.ts>` against your locally downloaded copy.

## Configure at runtime

On first launch you'll land on the sign-in screen. Fill in:

- **OAuth client id** — from the Volvo developer portal.
- **OAuth client secret** — from the portal.
- **VCC API key** — from the portal (separate field on the app's confirmation page).
- **Redirect URI** — the HTTPS URL of your hosted `redirect/` bridge.
- **OAuth scopes** — pre-filled with the full default set; leave as-is unless you intentionally want a narrower token.

Tap **Connect Volvo account** — this opens your system browser for Volvo's login + vehicle-picker consent. After approving, you're back in the app and the Garage tab lists your vehicle(s).

You can edit any of these later under the **Settings** tab. Changing the OAuth client/secret/VCC-API-Key automatically signs you out so the next sign-in uses the new credentials cleanly.

## Continuous Integration

`.github/workflows/release.yml` builds a release APK whenever you push a tag matching `v*`:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The workflow installs JDK 17 + Android SDK 35 + NDK 27.1, runs `pnpm install`, `pnpm prebuild --no-install`, lints/typechecks/tests, then `./gradlew assembleRelease` with the keystore secrets, and uploads the APK both as a workflow artifact and as a GitHub Release asset.

## API surface (covered today)

- `GET  /connected-vehicle/v2/vehicles`
- `GET  /connected-vehicle/v2/vehicles/{vin}`
- `GET  /connected-vehicle/v2/vehicles/{vin}/{doors,windows,fuel,odometer,tyres,engine,engine-status,brakes,diagnostics,warnings,statistics,commands,command-accessibility}`
- `POST /connected-vehicle/v2/vehicles/{vin}/commands/{lock,lock-reduced-guard,unlock,honk,flash,honk-flash,climatization-start,climatization-stop,engine-start,engine-stop}`
- `GET  /energy/v2/vehicles/{vin}/{state,capabilities}`
- `GET  /location/v1/vehicles/{vin}/location`

## Security notes

- The OAuth client_id is *not* a secret — it is shipped with the APK and protected by PKCE on the code exchange.
- The OAuth **client_secret** *is* a secret and is held only in the device's Android Keystore (via `expo-secure-store`).
- The VCC-API-Key is rate-limited per key; treat it as semi-secret. It is also held only in the Keystore.
- Tokens never leave the device.
- The app requests only `INTERNET`. Location permission is explicitly *blocked* — we read the **vehicle's** location from the API, never the device's GPS.

## Troubleshooting

- **"OAuth client_id is not set" on Reconnect** — open Settings, fill in the credentials, save (this also signs you out if you were already signed in).
- **OAuth fails with `invalid_request` before the password prompt** — your developer-portal application is **unpublished**, or the redirect URI registered there does not match what's saved in the app (trailing slash and scheme matter).
- **Sign-in succeeds but Garage shows "No vehicles linked"** — the OAuth flow re-used a cached Volvo session whose consent has 0 vehicles selected. Tap **Reconnect** on the Garage screen — it sends `prompt=login` so Volvo re-prompts for password and the vehicle-picker. If Volvo still skips the picker, sign out of `volvoid.eu.volvocars.com` in your default browser, or revoke this app at <https://www.volvocars.com/intl/v/your-volvo> → connected apps, then reconnect.
- **401 immediately after changing credentials** — older tokens are bound to the previous client. Settings auto-signs-out on credential change.
- **Tyre cells say "—" or "No sensor"** — Volvo returns `UNSPECIFIED` / `NO_SENSOR` when the car hasn't pushed a fresh TPMS reading lately. Driving the car (or unlocking it) usually wakes the sensors. If it persists across drives, your model only exposes aggregate warnings, not per-corner pressures.

## License

GPL-3.0-or-later. See [`LICENSE`](LICENSE) for the full text. The licence applies only to this project's own source code; it does **not** purport to grant rights in any third-party trademark, including the Volvo Marks. See [`TRADEMARKS.md`](TRADEMARKS.md).
