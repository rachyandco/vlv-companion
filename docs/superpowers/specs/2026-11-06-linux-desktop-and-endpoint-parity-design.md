# Linux desktop app (Rust) and full Volvo API endpoint coverage

**Status:** Ready for approval
**Date:** 2026-11-06
**Scope:** (1) Make the Android app call every read endpoint the three Volvo
APIs expose. (2) Add a Rust desktop client for Linux, in this repo, that
mirrors the Android app and ships as a `.deb` from the same tag-triggered
GitHub release that builds the APK.

## 1. Intent

The owner wants to see the car from a computer, not just the phone: lock state,
battery, range, doors, windows, tyres, health, trip statistics and the car's
position on a map, and to send the same commands, above all starting
climatisation before leaving. The desktop app must feel like the phone app
(same dark look, same cards, same car top-view) while using the room a desktop
window gives: one dashboard for the selected car with everything visible at
once, and a left menu that adapts to what is signed in.

While doing this, the audit of the Volvo OpenAPI specs showed the phone app
reads only 12 of the 19 available read endpoints although the README claims
all of them. Both apps will cover all 19 reads and all 10 commands.

## 2. Goals, non-goals, anti-goals

Goals

- Android app fetches and shows the seven endpoints it does not use today.
- A Linux desktop app, Rust, in `desktop/`, with feature parity with the phone
  app: multi-car garage, every read, every command, settings, sign-in.
- A `.deb` attached to the same GitHub release as the APK on every `v*` tag.
- Same OAuth application and redirect bridge as the phone app; nothing new to
  register in the Volvo developer portal.
- Visual kinship: same palette, card style, car top-view image and overlays.

Non-goals

- Windows or macOS builds, Flatpak, AppImage, snap.
- Sharing code between the TypeScript and Rust apps.
- Pixel-identical UI. The desktop uses a dashboard layout (§6), not the phone's
  tab navigation.
- Changing the Android release pipeline beyond adding the desktop job.

Anti-goals (would make this a failure even if it works)

- Any Google or Firebase dependency on either platform.
- Secrets written anywhere world-readable, or leaving the machine.
- A desktop sign-in that needs a different portal application or redirect URI
  than the phone.

## 3. Endpoint audit (done 2026-11-06)

Source of truth: the committed OpenAPI-derived types in `src/api/types.*.gen.ts`
(from May 2026). Cross-checked against the Home Assistant Volvo client
(`thomasddn/volvo-cars-api` v0.5.0, released 2026-11-04): it uses the same set,
so no endpoint has been added since. The portal itself blocks unauthenticated
fetches, so the live spec could not be re-downloaded.

| API | Endpoint | Phone today | After this work |
|---|---|---|---|
| connected-vehicle v2 | `GET /vehicles` | yes | yes |
| | `GET /vehicles/{vin}` | yes | yes |
| | `GET /vehicles/{vin}/doors` | yes | yes |
| | `GET /vehicles/{vin}/fuel` | yes | yes |
| | `GET /vehicles/{vin}/odometer` | yes | yes |
| | `GET /vehicles/{vin}/tyres` | yes | yes |
| | `GET /vehicles/{vin}/diagnostics` | yes | yes |
| | `GET /vehicles/{vin}/command-accessibility` | yes | yes |
| | `GET /vehicles/{vin}/windows` | **no** | yes |
| | `GET /vehicles/{vin}/warnings` | **no** | yes |
| | `GET /vehicles/{vin}/statistics` | **no** | yes |
| | `GET /vehicles/{vin}/engine` | **no** | yes |
| | `GET /vehicles/{vin}/engine-status` | **no** | yes |
| | `GET /vehicles/{vin}/brakes` | **no** | yes |
| | `GET /vehicles/{vin}/commands` | **no** | yes |
| | `POST …/commands/{lock, lock-reduced-guard, unlock, honk, flash, honk-flash, climatization-start, climatization-stop, engine-start, engine-stop}` | yes (10) | yes (10) |
| energy v2 | `GET /vehicles/{vin}/capabilities` | yes | yes |
| | `GET /vehicles/{vin}/state` | yes | yes |
| location v1 | `GET /vehicles/{vin}/location` | yes | yes |

Energy v1 (`recharge-status`) is deprecated upstream and intentionally skipped.

## 4. Part 1 — Android app: the seven missing reads

### 4.1 API layer and hooks

- `src/api/vehicles.ts`: add `getWindows`, `getWarnings`, `getStatistics`,
  `getEngineDiagnostics` (`/engine`), `getEngineStatus` (`/engine-status`),
  `getBrakes`, `listCommands` (`/commands`). Response types come from the
  existing generated types.
- `src/hooks/useVehicle.ts`: one hook each, keyed under the existing
  `["vehicle", vin]` prefix so the post-command invalidation in
  `useInvokeCommand` keeps covering them. Stale times, my call: windows and
  engine-status 30 s (they change with use), warnings, brakes, engine
  diagnostics and statistics 5 min, commands list 24 h (static per car).

### 4.2 Where they show on the phone

- **Overview** (`app/(tabs)/vehicle/[vin]/index.tsx`)
  - `CarTopView` gains window overlays (four windows plus sunroof when
    reported) next to the existing door overlays, using the same colours the
    door overlays use today (closed green, open red). The component takes an optional `windows` prop; nothing
    changes when it is absent.
  - Header line gains the engine state from `/engine-status` ("Engine
    running" / "Engine off") after the availability text.
  - New **Health** section under the tyres: the oil-level and coolant-level
    warnings from `/engine`, the brake-fluid warning from `/brakes`, and the
    `/warnings` entries (bulbs and similar), each as a `StatusTile`. These
    endpoints report warning states, not quantities: a tile reads "OK" in
    green when the value is the spec's no-warning value, otherwise the
    warning text in amber. Fields a car does not support render the existing
    "—" / unsupported style.
  - New **Trip** section: the `/statistics` values: trip meter 1 and 2,
    average speed, average fuel consumption, distance to empty, with the units
    the spec attaches to each.
- **Commands** (`commands.tsx`): fetch `/commands` once per car. Commands the
  car does not list are rendered disabled with the label "Not supported by
  this car". The spec enumerates command names in upper snake case; the
  builder maps them to the ten kebab-case POST paths in one table in
  `src/api/commands.ts` and unit-tests it. If a car returns an empty or
  errored list, nothing is disabled (today's behaviour).
- Pull-to-refresh and the Refresh action refetch the new queries too.

### 4.3 README

The "API surface (covered today)" section becomes true. Nothing else changes
on the Android side.

### 4.4 Tests

Vitest covers the command-name mapping and any new pure formatting helper.
Screens are verified by hand on the Volla phone over adb, as done for 1.0.2.

## 5. Part 2 — Desktop app: how it is made

Decisions here are the owner's where stated, otherwise my calls.

- **Language and placement (owner):** Rust, in this repo, directory
  `desktop/`, its own `Cargo.toml` (no workspace at the repo root, so the
  JavaScript tooling is untouched). Crate `vlv-companion-desktop`, binary
  `vlv-companion`.
- **UI toolkit (my call):** `eframe`/`egui`. Pure Rust, dark theme is fully
  controllable, runs on X11 and Wayland, and keeps the `.deb` free of GTK or Qt
  runtime dependencies. Map via the `walkers` crate (slippy map for egui).
- **HTTP and async (my call):** `reqwest` with `rustls` (no OpenSSL runtime
  dependency), `tokio` runtime on a background thread, `serde` models
  hand-written from the generated TypeScript types for only the fields the
  UI shows, with `#[serde(default)]` everywhere so unknown or missing fields
  never break parsing.
- **OAuth (my call):** `oauth2` crate, authorization-code + PKCE S256, client
  secret sent as HTTP Basic (what Keycloak accepts, as verified on the
  phone), same Keycloak endpoints as `src/auth/config.ts`, same default scope
  list (no `offline_access`), same `nonce` and `state` checks, same refusal
  of `dc-` client ids with the same wording.
- **Map tiles (my call):** raster tiles through a tile URL template in
  Settings. The field ships **empty**: the map area shows "No tile server
  configured" with a one-click **Use OpenStreetMap tiles** button that fills
  in the standard OSM template, plus a link to the OSM tile usage policy. The
  app therefore never uses openstreetmap.org tiles by default, which that
  policy forbids for distributed apps, while the owner gets a working map in
  one click. Requests carry a `User-Agent` naming the app and version.
  OpenFreeMap, which the phone uses, serves vector tiles that `walkers`
  cannot render.
- **Storage (my call):** `$XDG_CONFIG_HOME/vlv-companion/config.json` for
  credentials, redirect URI, scopes, per-car preferences and the selected car;
  `$XDG_STATE_HOME/vlv-companion/tokens.json` for tokens and the local
  climatisation timer. Both files and their directory are created with mode
  0600 / 0700. No keyring dependency: it would add a D-Bus secret-service
  requirement that minimal window managers often lack.
- **Packaging (my call):** `cargo-deb`, built on an `ubuntu-22.04` runner so
  the binary links against a glibc old enough for 22.04 and newer. Runtime
  `Depends`: `libxkbcommon0`, `libgl1`, `libwayland-client0`, `libx11-6`,
  `libxcursor1`, `libxi6`, `libxrandr2`, `libfontconfig1`, `xdg-utils`.
- **Toolchain:** stable Rust, pinned through `rust-toolchain.toml` to the
  version current when the builder starts. `cargo clippy -D warnings` and
  `cargo test` run in CI before packaging.

## 6. Part 2 — What the desktop app is

### 6.1 Window layout ("Option A", chosen by the owner from mockups)

Left menu, fixed width:

- App name.
- One entry per car from `/vehicles`, label = the per-car name from
  preferences, else "modelYear model". The selected car is highlighted; the
  default car is the one selected last time (persisted).
- Spacer, then **Refresh**, **Settings**, **Sign out**.

Main pane for the selected car, top to bottom, scrollable:

1. Header: "2024 XC40 · Onyx Black · AUTOMATIC", availability from
   `command-accessibility`, engine state, and "updated hh:mm".
2. Status cards in one row: Central lock (tappable, same confirm as the phone's
   `LockTile`), Battery with a thin bar, Range, Odometer, Fuel (hidden for EVs),
   Service distance.
3. Middle row: left, the car top-view (`assets/volvo-top-black.png` embedded
   with `include_bytes!`) with door, hood, trunk and window overlays, and the
   four tyre pressure cells beside it; right, the map centred on the car with a
   marker, the address line if the API gives one, "updated n min ago", an
   **Open in maps** button (`xdg-open geo:lat,lng`), a **Refresh** button and
   a **Chargers** toggle that overlays charging stations from the same
   Overpass query the phone uses, each clickable for the detail card.
4. Energy row: the phone's Energy screen as cards: Charger connection,
   Charging status, Charge type, Charging power, Target SoC, Time to target,
   Current limit. Unsupported capabilities render greyed as on the phone.
5. Health row: oil level, coolant level, brake fluid level, warnings.
6. Trip row: trip statistics.
7. Command bar, two rows of equal-width buttons: Lock, Lock (reduced guard),
   Unlock, Honk, Flash, Honk and flash; Start climatisation, Stop
   climatisation, Engine start with a 1–15 min slider, Engine stop. Engine
   buttons hidden for EVs. Commands the car does not list are disabled.

Above the command bar: the availability dot and reason, the unlock-ready
countdown banner, the climatisation-running banner (local 30-minute timer, same
disclaimer text as the phone), and the privacy-mode sticky banner.

### 6.2 Screens other than the dashboard

- **Sign-in** (shown when there are no tokens): the same five fields as the
  phone (client id, secret, VCC API key, redirect URI, scopes), the same
  default-bridge warning, the same `dc-` warning, and **Connect Volvo
  account**, which opens the system browser. Below it, a **Paste callback
  URL** field with a **Finish sign-in** button, for browsers that refuse to
  hand a custom scheme to the desktop.
- **Settings**: the same five fields, the tile URL, and per-car name and
  EV toggle for every car in the garage. Saving a changed client id, secret,
  key or scopes signs out, as on the phone.
- **Session expired**: a banner on the dashboard with a **Reconnect** button;
  commands and refresh are disabled until reconnected.

### 6.3 Sign-in flow in detail

1. The app builds the authorize URL (PKCE verifier and `state` kept in
   memory) and runs `xdg-open` on it.
2. Volvo redirects to the HTTPS bridge, which forwards to
   `volvo-companion://oauth/callback?code=…&state=…`.
3. The `.deb` installs `/usr/share/applications/vlv-companion.desktop` with
   `MimeType=x-scheme-handler/volvo-companion;` and `Exec=vlv-companion %u`.
   The browser launches a second `vlv-companion` process with the URL.
4. That process connects to `$XDG_RUNTIME_DIR/vlv-companion.sock`, writes the
   URL, and exits. The running instance, which owns the socket, verifies
   `state`, exchanges the code with the PKCE verifier, verifies the `nonce`
   if an id token is returned, stores tokens, and loads the garage.
5. If no instance is running, the new process starts normally and shows the
   sign-in screen with the message "Start sign-in from this window, then
   return here", since the PKCE verifier only exists in the process that
   started the flow.
6. The paste field (§6.2) feeds the same handler as the socket.

### 6.4 Data refresh and errors

- A background task owns the API client and a cache keyed by VIN and
  resource, each with a stale time matching the phone's: doors, windows,
  lock, accessibility, engine status 30 s; fuel, location 60 s; odometer,
  tyres, diagnostics, statistics, brakes, engine, warnings 5 min; vehicle
  details 1 h; energy capabilities, commands list 24 h.
- Auto-refresh is budgeted (my call), because the phone and the desktop
  share one VCC API key and a secondary source puts the free tier at 10 000
  calls per day per application. Rules: refetch stale resources for the
  selected car only while the window is focused; tick every 60 s; after
  5 min without keyboard or mouse input in the window, tick every 5 min;
  never while minimised. Worst case with the window focused and in use all
  day is about 3 000 calls, idle all day about 600. **Refresh** forces
  everything regardless. After an accepted command, the car's resources are
  refetched 5 s later, as on the phone. The tick interval and idle threshold
  are constants in one place so they can be tuned if the quota turns out
  tighter.
- 401 → one refresh-token exchange, then retry; a failed refresh signs out
  and shows the session-expired banner. 403 → shown on the affected card
  with the phone's region-restriction hint. Network errors → "offline"
  text in the header, cached values stay on screen.
- Command results use the same `invokeStatus` buckets and friendly messages
  as `src/api/commands.ts`.

### 6.5 Look

- Background `#0b0c0f`, text `#e8eaed` / `#bdc1c6` / `#9aa0a6`, card fill
  `rgba(255,255,255,0.04)` with `0.08` border, accent `rgba(64,128,255,…)`,
  success green `#34d399`, warning amber `#f59e0b`, danger red for unlock
  and engine start, radius 12 px. Same font family fallback as the phone
  (system sans). A single `theme.rs` holds these values.
- Window title "Vlv Companion". App icon from `assets/icon.png`.
- The trademark notice from `TRADEMARKS.md` appears in Settings, as the
  phone's sign-in screen shows it.

## 7. Release pipeline

`.github/workflows/release.yml` gains a `desktop` job that runs in parallel
with `build`:

- `runs-on: ubuntu-22.04`, read-only permissions.
- Install stable Rust, `cargo-deb`, and the build-time packages
  (`libxkbcommon-dev`, `libwayland-dev`, `libgl1-mesa-dev`, `libfontconfig1-dev`).
- `cargo fmt --check`, `cargo clippy -D warnings`, `cargo test`.
- Fail if `desktop/Cargo.toml` version ≠ tag without the leading `v`, so the
  `.deb` version always matches the release, as the Android job refuses
  unsigned builds.
- `cargo deb` → upload artifact `vlv-companion-${tag}-deb`.

The `release` job needs both `build` and `desktop` and runs only when both
succeeded (owner's decision: a release exists only if the APK and the `.deb`
both built). It downloads both artifacts and attaches
`vlv-companion-${tag}.apk` and `vlv-companion_${ver}_amd64.deb` to the same
GitHub release. A failed desktop job therefore blocks the APK too; the fix is
to repair and re-tag. The desktop job never sees the keystore secrets.

## 8. Repository changes

- `desktop/` — the crate: `Cargo.toml`, `rust-toolchain.toml`, `src/`
  (`main.rs`, `app.rs`, `ui/` per section, `api/`, `auth/`, `config.rs`,
  `theme.rs`, `ipc.rs`), `packaging/vlv-companion.desktop`, and the
  `[package.metadata.deb]` block.
- `README.md` — a "Linux desktop" section: install the `.deb`, first sign-in,
  where config and tokens live, how to build locally (`cargo run`,
  `cargo deb`), the custom-scheme handler, and the paste-URL fallback.
- Version bump for the combined release is the owner's call at release time;
  the builder keeps `desktop/Cargo.toml` in step with `app.config.ts`.

## 9. Verification

- Unit tests: token expiry and refresh decision, callback URL parsing and
  `state` check, config file permissions, command-name mapping, climate
  timer math, invoke-status buckets.
- Manual, on the owner's Ubuntu 24.04 / i3 / X11 machine: install the
  `.deb`, sign in through the bridge with the `vid-dcr-` client, confirm the
  dashboard loads every section for the XC40, start and stop climatisation,
  lock and unlock, verify the custom-scheme handoff and the paste fallback,
  and verify a refresh after the access token expires.
- Phone: the seven new sections verified on the Volla over adb.

## 10. Left to the builder

- Exact egui widget composition, scroll behaviour and responsive breakpoints
  for narrower windows.
- Overpass query shape for the charger overlay (copy the phone's).
- How the walkers tile cache is sized and where it lives (`$XDG_CACHE_HOME`).
- Whether the background task uses channels or a shared `Arc<Mutex<Cache>>`.
- Mapping of the spec's upper-snake command names to POST paths.
- Formatting of statistics values and units, following the spec's unit fields.
