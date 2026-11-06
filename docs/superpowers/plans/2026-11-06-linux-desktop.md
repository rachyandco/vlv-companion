# Linux Desktop App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Rust desktop client in `desktop/` that mirrors the Android app (garage, every read, every command, settings, Volvo ID sign-in) in a single-window dashboard, packaged as a `.deb` attached to the same GitHub release as the APK.

**Architecture:** `eframe`/`egui` immediate-mode UI on the main thread; a `tokio` worker thread owns the HTTP client, token refresh and a per-VIN resource cache, and talks to the UI through two channels (`UiRequest` in, `WorkerEvent` out). OAuth is hand-rolled with `reqwest` (PKCE S256, Basic client auth, nonce and state checks) so it matches the phone exactly and avoids version coupling with an OAuth crate. A unix socket delivers the `volvo-companion://` callback from the second process the browser spawns. Pure logic (PKCE, URL parsing, config permissions, cache scheduling, command buckets, warnings) is unit-tested; the UI is verified by hand.

**Tech Stack:** Rust stable (pinned in `rust-toolchain.toml`), eframe/egui 0.37, walkers (version that depends on egui 0.37), reqwest 0.13 with `rustls-tls` and `json`, tokio 1 (`rt-multi-thread`, `net`, `sync`, `time`, `macros`), serde + serde_json, url, sha2, base64, rand, directories, chrono, thiserror, image (png only, for the icon and car view), cargo-deb 3.

**Spec:** `docs/superpowers/specs/2026-11-06-linux-desktop-and-endpoint-parity-design.md` §5–§10. This plan supersedes one line of §5: OAuth is implemented directly with reqwest rather than the `oauth2` crate.

## Global Constraints

- Crate name `vlv-companion-desktop`, binary `vlv-companion`, package name `vlv-companion`, `desktop/Cargo.toml` version equal to `app.config.ts` version (`1.0.2` now).
- Endpoints: issuer `https://auth.volvocars.com/realms/volvocars`, authorize `…/protocol/openid-connect/auth`, token `…/protocol/openid-connect/token`, revoke `…/protocol/openid-connect/revoke`, API base `https://api.volvocars.com`.
- Default redirect URI `https://volvo.roussel-zeter.eu/redirect/`; deep link `volvo-companion://oauth/callback`.
- Default scopes: the 24 strings in `src/auth/config.ts` `DEFAULT_SCOPES`, in that order. Never `offline_access`.
- Client ids matching `^dc-` (case-insensitive, trimmed) are refused with: `This OAuth client id starts with "dc-", which belongs to the retired Volvo ID service. Create a new application on developer.volvocars.com (its client id starts with "vid-") and enter the new client id and secret.`
- Headers on every API call: `Authorization: Bearer`, `vcc-api-key`, `Accept: application/json`; `User-Agent: VlvCompanion/<version> (linux-desktop)`.
- Files: `$XDG_CONFIG_HOME/vlv-companion/config.json`, `$XDG_STATE_HOME/vlv-companion/tokens.json`, directories 0700, files 0600. Tile cache under `$XDG_CACHE_HOME/vlv-companion/tiles`.
- Theme constants (`theme.rs`): bg `#0b0c0f`, text `#e8eaed`, muted `#bdc1c6`, dim `#9aa0a6`, card fill white 4 %, card border white 8 %, accent fill `rgb(64,128,255)` at 18 %, accent border at 50 %, accent text `#cfe0ff`, green `#34d399`, amber `#f59e0b`, red `#ef4444`, corner radius 12.
- Refresh budget: tick 60 s while focused, 300 s after 300 s without input, none while minimised. Post-command refetch after 5 s.
- No Google, Firebase, OpenSSL runtime or keyring dependency. `cargo clippy --all-targets -- -D warnings` and `cargo fmt --check` clean before every commit.

## Review Focus

1. `$XDG_RUNTIME_DIR` unset (plain `startx`, some containers): the IPC socket must fall back to `/tmp/vlv-companion-<uid>.sock` and sign-in must still complete (Task 4 test `socket_path_falls_back_without_runtime_dir`).
2. A callback whose `state` does not match, or that arrives when no sign-in is pending, must be rejected with a visible error and must not consume the pending verifier (Task 3 test `callback_with_wrong_state_is_rejected`, Task 9 tests `finish_sign_in_without_pending_flow_errors` and `finish_sign_in_keeps_pending_on_state_mismatch`).
3. `tokens.json` written by a future version with extra fields, or truncated, must not crash startup: parse failure → signed-out state (Task 2 test `tokens_parse_failure_yields_none`).
4. The energy `state` endpoint returns `{"status":"ERROR"}` per field for ICE cars; cards must show "—" and never panic (Task 5 test `energy_field_error_renders_dash`).
5. A long idle session: after the access token expires and the refresh fails with `invalid_grant`, the UI must show the session-expired banner once and stop polling, not loop (Task 9 test `refresh_failure_sets_session_expired_and_stops_polling`).

---

### Task 1: Crate scaffold, theme, packaging metadata

**Files:**
- Create: `desktop/Cargo.toml`, `desktop/rust-toolchain.toml`, `desktop/.gitignore` (`/target`), `desktop/src/main.rs`, `desktop/src/theme.rs`, `desktop/packaging/vlv-companion.desktop`, `desktop/packaging/icon-256.png` (converted from `assets/icon.png` with `convert assets/icon.png -resize 256x256 desktop/packaging/icon-256.png`, or the `image` crate if ImageMagick is absent), `desktop/README.md` (one paragraph pointing at the root README section).

**Interfaces:**
- Produces: `theme::apply(ctx: &egui::Context)` that installs dark visuals with the Global Constraints colours; `theme::Colors` struct with `pub const` fields `BG, TEXT, MUTED, DIM, CARD_FILL, CARD_BORDER, ACCENT_FILL, ACCENT_BORDER, ACCENT_TEXT, GREEN, AMBER, RED` of type `egui::Color32`, and `pub const RADIUS: f32 = 12.0`; `theme::card(ui: &mut egui::Ui, add: impl FnOnce(&mut egui::Ui))` draws a rounded frame with card fill/border.
- Produces: `main()` that creates the eframe window titled `Vlv Companion`, 1280×860 default, min 980×700, with the icon from `packaging/icon-256.png` via `include_bytes!`.

- [ ] **Step 1: Write `Cargo.toml`** with the dependencies from Tech Stack, `[[bin]] name = "vlv-companion", path = "src/main.rs"`, and:

```toml
[package.metadata.deb]
name = "vlv-companion"
maintainer = "rachyandco"
copyright = "2026, rachyandco. GPL-3.0-or-later"
license-file = ["../LICENSE", "0"]
extended-description = "Degoogled-friendly Linux client for the Volvo Cars public API. Independent project, not affiliated with Volvo Car Corporation."
section = "utils"
priority = "optional"
depends = "libxkbcommon0, libgl1, libwayland-client0, libx11-6, libxcursor1, libxi6, libxrandr2, libfontconfig1, xdg-utils"
assets = [
  ["target/release/vlv-companion", "usr/bin/", "755"],
  ["packaging/vlv-companion.desktop", "usr/share/applications/", "644"],
  ["packaging/icon-256.png", "usr/share/icons/hicolor/256x256/apps/vlv-companion.png", "644"],
]
```

- [ ] **Step 2: Write the `.desktop` file**

```ini
[Desktop Entry]
Type=Application
Name=Vlv Companion
Comment=Volvo Cars API client (independent project)
Exec=vlv-companion %u
Icon=vlv-companion
Terminal=false
Categories=Utility;
MimeType=x-scheme-handler/volvo-companion;
```

- [ ] **Step 3: Write `rust-toolchain.toml`** with `channel = "1.98.1"` (the installed stable), and `theme.rs` and a `main.rs` that shows the window with a centred "Vlv Companion" label.
- [ ] **Step 4: Verify it builds and runs**

Run: `cd desktop && cargo build 2>&1 | tail -3 && timeout 5 cargo run; echo "exit=$?"`
Expected: build succeeds; the window appears; exit 124 (killed by timeout) with no panic in the output.

- [ ] **Step 5: Verify packaging**

Run: `cd desktop && cargo install cargo-deb --locked 2>/dev/null; cargo deb 2>&1 | tail -2 && dpkg-deb -c target/debian/vlv-companion_1.0.2-1_amd64.deb | grep -E "usr/bin/vlv-companion|applications/vlv-companion.desktop|apps/vlv-companion.png"`
Expected: three lines listing the binary, desktop file and icon.

- [ ] **Step 6: Commit**

```bash
git add desktop
git commit -m "feat(desktop): crate scaffold, theme and deb packaging metadata"
```

---

### Task 2: Config and token files

**Files:**
- Create: `desktop/src/config.rs`, `desktop/src/paths.rs`
- Test: inline `#[cfg(test)] mod tests` in both files.

**Interfaces:**
- Produces `paths::Paths { config_dir: PathBuf, state_dir: PathBuf, cache_dir: PathBuf }` with `Paths::from_env() -> Paths` (uses `directories::ProjectDirs::from("eu", "roussel-zeter", "vlv-companion")`) and `Paths::in_dir(base: &Path) -> Paths` (everything under `base`, for tests).
- Produces `config::Config` (serde, `#[serde(default)]`): `client_id: String`, `client_secret: String`, `vcc_api_key: String`, `redirect_uri: String` (default = Global Constraints default), `scopes: Vec<String>` (default = the 24 scopes), `tile_url_template: Option<String>`, `selected_vin: Option<String>`, `vehicle_prefs: BTreeMap<String, VehiclePrefs>` where `VehiclePrefs { name: Option<String>, is_ev: bool }` keyed by upper-case VIN.
- Produces `config::Tokens`: `access_token: String`, `refresh_token: Option<String>`, `expires_at_unix: i64`, `id_token: Option<String>`, `climate_started_at: BTreeMap<String, i64>` (VIN → unix ms).
- Produces `config::load_config(p: &Paths) -> Config` (missing or unparsable → `Config::default()`), `save_config(p: &Paths, c: &Config) -> io::Result<()>`, `load_tokens(p: &Paths) -> Option<Tokens>`, `save_tokens(p, t) -> io::Result<()>`, `clear_tokens(p) -> io::Result<()>`. Saving creates the directory with mode 0700 and writes the file atomically (temp file + rename) with mode 0600.
- Produces `config::is_legacy_client_id(id: &str) -> bool`.

- [ ] **Step 1: Write the failing tests**

```rust
#[test] fn default_config_has_24_scopes_and_no_offline_access() {
    let c = Config::default();
    assert_eq!(c.scopes.len(), 24);
    assert!(!c.scopes.iter().any(|s| s == "offline_access"));
    assert_eq!(c.redirect_uri, "https://volvo.roussel-zeter.eu/redirect/");
}
#[test] fn save_then_load_round_trips_and_sets_0600() {
    let dir = tempfile::tempdir().unwrap(); let p = Paths::in_dir(dir.path());
    let mut c = Config::default(); c.client_id = "vid-dcr-x".into();
    save_config(&p, &c).unwrap();
    let mode = std::fs::metadata(p.config_dir.join("config.json")).unwrap().permissions().mode() & 0o777;
    assert_eq!(mode, 0o600);
    assert_eq!(std::fs::metadata(&p.config_dir).unwrap().permissions().mode() & 0o777, 0o700);
    assert_eq!(load_config(&p).client_id, "vid-dcr-x");
}
#[test] fn tokens_parse_failure_yields_none() {
    let dir = tempfile::tempdir().unwrap(); let p = Paths::in_dir(dir.path());
    std::fs::create_dir_all(&p.state_dir).unwrap();
    std::fs::write(p.state_dir.join("tokens.json"), b"{\"access_token\": 12").unwrap();
    assert!(load_tokens(&p).is_none());
}
#[test] fn tokens_with_unknown_fields_still_load() {
    let dir = tempfile::tempdir().unwrap(); let p = Paths::in_dir(dir.path());
    std::fs::create_dir_all(&p.state_dir).unwrap();
    std::fs::write(p.state_dir.join("tokens.json"), br#"{"access_token":"a","expires_at_unix":1,"future":true}"#).unwrap();
    assert_eq!(load_tokens(&p).unwrap().access_token, "a");
}
#[test] fn legacy_client_ids() {
    assert!(is_legacy_client_id(" DC-abc "));
    assert!(!is_legacy_client_id("vid-dcr-abc"));
}
```

Add `tempfile` as a dev-dependency.

- [ ] **Step 2: Run to verify failure** — `cd desktop && cargo test config` → compile error (module missing).
- [ ] **Step 3: Implement** `paths.rs` and `config.rs`.
- [ ] **Step 4: Run to verify pass** — `cargo test config` → 5 passed.
- [ ] **Step 5: Commit**

```bash
git add desktop/src/config.rs desktop/src/paths.rs desktop/src/main.rs desktop/Cargo.toml desktop/Cargo.lock
git commit -m "feat(desktop): config and token storage with 0600 files"
```

---

### Task 3: Volvo ID OAuth (PKCE, authorize URL, callback, token exchange, refresh)

**Files:**
- Create: `desktop/src/auth/mod.rs`, `desktop/src/auth/pkce.rs`, `desktop/src/auth/flow.rs`, `desktop/src/auth/token.rs`
- Test: inline tests; `httpmock` as dev-dependency for token endpoint tests.

**Interfaces:**
- `pkce::Pkce { verifier: String, challenge: String }` with `Pkce::generate() -> Pkce` (43–128 char unreserved verifier from `rand`) and `pkce::challenge_s256(verifier: &str) -> String` (base64url, no padding, of SHA-256).
- `flow::PendingSignIn { state: String, nonce: String, pkce: Pkce, redirect_uri: String }`.
- `flow::build_authorize_url(cfg: &Config, prompt: Option<&str>) -> Result<(url::Url, PendingSignIn), AuthError>`: errors `AuthError::MissingClientId`, `AuthError::LegacyClientId` (message = Global Constraints text), `AuthError::NoScopes`. Query params: `client_id, redirect_uri, response_type=code, scope` (space-joined), `state, nonce, code_challenge, code_challenge_method=S256`, and `prompt` when given.
- `flow::parse_callback(url: &str, pending: &PendingSignIn) -> Result<String, AuthError>`: accepts `volvo-companion://oauth/callback?...` and the HTTPS bridge URL; returns the `code`; errors `AuthError::OAuth { error, description }` when `error=` present, `AuthError::MissingCode`, `AuthError::StateMismatch`.
- `token::TokenEndpoint { token_url: String, client_id: String, client_secret: Option<String> }` with `async fn exchange_code(&self, http: &reqwest::Client, code: &str, verifier: &str, redirect_uri: &str, nonce: &str) -> Result<Tokens, AuthError>` and `async fn refresh(&self, http, refresh_token: &str) -> Result<Tokens, AuthError>`. Both POST `application/x-www-form-urlencoded`, `Authorization: Basic base64(client_id:client_secret)` when a secret is set, else `client_id` in the body. `exchange_code` verifies the id token `nonce` claim when present (`AuthError::NonceMismatch`). Non-2xx → `AuthError::OAuth` with the body's `error` / `error_description`.
- `token::needs_refresh(expires_at_unix: i64, now_unix: i64) -> bool` is true when `expires_at_unix - 60 <= now_unix`.
- `token::read_jwt_claim(jwt: &str, claim: &str) -> Option<String>` (base64url payload, no signature check).

- [ ] **Step 1: Write the failing tests**

```rust
#[test] fn rfc7636_challenge_vector() {
    assert_eq!(challenge_s256("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
}
#[test] fn generated_verifier_is_valid() { let p = Pkce::generate(); assert!((43..=128).contains(&p.verifier.len())); assert_eq!(p.challenge, challenge_s256(&p.verifier)); }
#[test] fn authorize_url_carries_every_param() {
    let mut c = Config::default(); c.client_id = "vid-dcr-x".into();
    let (u, pending) = build_authorize_url(&c, Some("login")).unwrap();
    assert!(u.as_str().starts_with("https://auth.volvocars.com/realms/volvocars/protocol/openid-connect/auth?"));
    let q: std::collections::HashMap<_, _> = u.query_pairs().into_owned().collect();
    assert_eq!(q["client_id"], "vid-dcr-x"); assert_eq!(q["response_type"], "code");
    assert_eq!(q["code_challenge_method"], "S256"); assert_eq!(q["code_challenge"], pending.pkce.challenge);
    assert_eq!(q["state"], pending.state); assert_eq!(q["nonce"], pending.nonce); assert_eq!(q["prompt"], "login");
    assert!(q["scope"].starts_with("openid conve:vehicle_relation")); assert!(!q["scope"].contains("offline_access"));
}
#[test] fn legacy_client_id_is_refused() { let mut c = Config::default(); c.client_id = "dc-x".into(); assert!(matches!(build_authorize_url(&c, None), Err(AuthError::LegacyClientId))); }
#[test] fn callback_with_wrong_state_is_rejected() {
    let p = pending_fixture("S1");
    assert!(matches!(parse_callback("volvo-companion://oauth/callback?code=c&state=S2", &p), Err(AuthError::StateMismatch)));
    assert!(matches!(parse_callback("volvo-companion://oauth/callback?code=c", &p), Err(AuthError::StateMismatch)));
}
#[test] fn callback_happy_and_error_paths() {
    let p = pending_fixture("S1");
    assert_eq!(parse_callback("volvo-companion://oauth/callback?code=abc&state=S1", &p).unwrap(), "abc");
    assert_eq!(parse_callback("https://volvo.roussel-zeter.eu/redirect/?code=abc&state=S1", &p).unwrap(), "abc");
    assert!(matches!(parse_callback("volvo-companion://oauth/callback?error=invalid_scope&error_description=x&state=S1", &p), Err(AuthError::OAuth { .. })));
}
#[test] fn needs_refresh_uses_60s_leeway() { assert!(needs_refresh(1000, 940)); assert!(!needs_refresh(1000, 939)); }
#[tokio::test] async fn exchange_sends_basic_auth_and_parses_tokens() {
    let server = httpmock::MockServer::start();
    let m = server.mock(|w, t| { w.method("POST").path("/token").header("authorization", "Basic aWQ6c2VjcmV0").body_contains("grant_type=authorization_code").body_contains("code_verifier=v1");
        t.status(200).json_body(serde_json::json!({"access_token":"A","refresh_token":"R","expires_in":300})); });
    let ep = TokenEndpoint { token_url: server.url("/token"), client_id: "id".into(), client_secret: Some("secret".into()) };
    let t = ep.exchange_code(&reqwest::Client::new(), "c", "v1", "https://r/", "n").await.unwrap();
    m.assert(); assert_eq!(t.access_token, "A"); assert_eq!(t.refresh_token.as_deref(), Some("R"));
    assert!(t.expires_at_unix > chrono::Utc::now().timestamp() + 200);
}
#[tokio::test] async fn exchange_error_body_is_surfaced() {
    let server = httpmock::MockServer::start();
    server.mock(|w, t| { w.method("POST").path("/token"); t.status(400).json_body(serde_json::json!({"error":"invalid_grant","error_description":"Code not valid"})); });
    let ep = TokenEndpoint { token_url: server.url("/token"), client_id: "id".into(), client_secret: None };
    let e = ep.exchange_code(&reqwest::Client::new(), "c", "v", "https://r/", "n").await.unwrap_err();
    assert_eq!(e.to_string(), "invalid_grant: Code not valid");
}
```

`pending_fixture(state)` is a test helper building a `PendingSignIn` with the given state.

- [ ] **Step 2: Run to verify failure** — `cargo test auth` → compile error.
- [ ] **Step 3: Implement** the four files. `Tokens.expires_at_unix = now + expires_in`; keep the previous refresh token when the response omits one.
- [ ] **Step 4: Run to verify pass** — `cargo test auth` → 9 passed.
- [ ] **Step 5: Commit**

```bash
git add desktop/src/auth desktop/src/main.rs desktop/Cargo.toml desktop/Cargo.lock
git commit -m "feat(desktop): Volvo ID OAuth with PKCE, nonce and state checks"
```

---

### Task 4: Callback IPC over a unix socket

**Files:**
- Create: `desktop/src/ipc.rs`
- Modify: `desktop/src/main.rs` (argument handling)

**Interfaces:**
- `ipc::socket_path() -> PathBuf`: `$XDG_RUNTIME_DIR/vlv-companion.sock` when set, else `/tmp/vlv-companion-<uid>.sock`; `ipc::socket_path_in(runtime_dir: Option<&Path>, uid: u32) -> PathBuf` is the testable core.
- `ipc::try_forward(path: &Path, url: &str) -> bool`: connects, writes `url` + `\n`, returns true on success (blocking std `UnixStream`, 2 s timeout).
- `ipc::Listener::bind(path: &Path) -> io::Result<Listener>` (removes a stale file first, sets 0600) and `Listener::into_receiver(self) -> std::sync::mpsc::Receiver<String>` spawning a thread that reads one line per connection.
- `main`: if `argv[1]` starts with `volvo-companion://` and `try_forward` succeeds → exit 0; otherwise start the app and, if an argument was given, pass it as `initial_callback: Option<String>` to the app (which will show the "Start sign-in from this window" error, Task 9).

- [ ] **Step 1: Write the failing tests**

```rust
#[test] fn socket_path_falls_back_without_runtime_dir() {
    assert_eq!(socket_path_in(Some(Path::new("/run/user/1000")), 1000), PathBuf::from("/run/user/1000/vlv-companion.sock"));
    assert_eq!(socket_path_in(None, 1000), PathBuf::from("/tmp/vlv-companion-1000.sock"));
}
#[test] fn forward_round_trip() {
    let dir = tempfile::tempdir().unwrap(); let p = dir.path().join("s.sock");
    let rx = Listener::bind(&p).unwrap().into_receiver();
    assert!(try_forward(&p, "volvo-companion://oauth/callback?code=1&state=2"));
    assert_eq!(rx.recv_timeout(std::time::Duration::from_secs(2)).unwrap(), "volvo-companion://oauth/callback?code=1&state=2");
}
#[test] fn forward_without_listener_is_false() {
    let dir = tempfile::tempdir().unwrap();
    assert!(!try_forward(&dir.path().join("none.sock"), "x"));
}
```

- [ ] **Step 2: Run to verify failure** — `cargo test ipc` → compile error.
- [ ] **Step 3: Implement** `ipc.rs` and the `main` argument handling.
- [ ] **Step 4: Run to verify pass** — `cargo test ipc` → 3 passed.
- [ ] **Step 5: Commit**

```bash
git add desktop/src/ipc.rs desktop/src/main.rs
git commit -m "feat(desktop): deliver the OAuth callback to the running instance over a unix socket"
```

---

### Task 5: API models

**Files:**
- Create: `desktop/src/api/mod.rs`, `desktop/src/api/models.rs`
- Test: `desktop/src/api/models.rs` inline tests with JSON fixtures.

**Interfaces:**
- `models::Resource<T> { value: T, updated_at: Option<String>, unit: Option<String> }` (serde rename camelCase) and type aliases `RString = Resource<String>`, `RNumber = Resource<f64>`.
- Envelope `models::Envelope<T> { data: Option<T> }` (also tolerates `status`, `operationId`).
- Structs (all fields `Option`, `#[serde(default, rename_all = "camelCase")]`): `VehicleListItem { vin }`, `VehicleDetails { vin, model_year: Option<i64>, gearbox, fuel_type, external_colour, descriptions: Option<Descriptions { model }> }`, `Doors` (8 fields as the TS type), `Windows` (5), `Fuel { fuel_amount: Option<RNumber> }`, `Odometer { odometer: Option<RNumber> }`, `Tyres` (4), `Diagnostics` (6), `CommandAccessibility { availability_status: Option<Availability { value: String, unavailable_reason: Option<String> }> }`, `EngineDiagnostics` (2), `EngineStatus { engine_status }`, `Brakes { brake_fluid_level_warning }`, `Statistics` (5 `RNumber`), `ExteriorWarnings` as `BTreeMap<String, RString>` (flatten), `CommandListItem { command: Option<String> }`.
- Energy: `EnergyField<T>` enum with `#[serde(tag = "status")]` variants `Ok { value: T, unit: Option<String> }` and `Error { code: Option<String>, message: Option<String> }`; `EnergyState` with the 9 fields as in the TS type, each `Option<EnergyField<serde_json::Value>>`; `EnergyCapabilities { get_energy_state: Option<serde_json::Value> }` plus `fn is_supported(&self, field: &str) -> Option<bool>` reading `getEnergyState.<field>.isSupported`.
- Location: `LocationResponse { data: Option<Feature { geometry: Option<Geometry { coordinates: Vec<f64> }>, properties: Option<BTreeMap<String, serde_json::Value>> }> }` and `fn parsed(&self) -> Option<ParsedLocation { longitude, latitude, heading: Option<f64>, timestamp: Option<String> }>` (coordinates are `[lon, lat(, alt)]`; `heading` and `timestamp` from properties when present).
- Invoke: `InvokeResponse { data: Invoke { vin: Option<String>, invoke_status: String, message: Option<String>, ready_to_unlock: Option<bool>, ready_to_unlock_until: Option<i64> } }`.
- Display helper `models::render(r: Option<&Resource<impl Display>>) -> String`: `"—"` when `None`, else value plus unit when present, numbers rounded to 2 decimals; `models::render_energy(f: Option<&EnergyField<serde_json::Value>>) -> String` same rule, `"—"` for `Error`.

- [ ] **Step 1: Write the failing tests** — one `#[test]` per struct parsing a minimal JSON literal copied from the shapes above, plus:

```rust
#[test] fn energy_field_error_renders_dash() {
    let f: EnergyField<serde_json::Value> = serde_json::from_str(r#"{"status":"ERROR","code":"E","message":"m"}"#).unwrap();
    assert_eq!(render_energy(Some(&f)), "—");
    let ok: EnergyField<serde_json::Value> = serde_json::from_str(r#"{"status":"OK","value":44,"unit":"%"}"#).unwrap();
    assert_eq!(render_energy(Some(&ok)), "44 %");
}
#[test] fn location_without_data_parses_to_none() {
    let r: LocationResponse = serde_json::from_str(r#"{"status":404,"operationId":"x"}"#).unwrap();
    assert!(r.parsed().is_none());
}
#[test] fn location_coordinates_are_lon_lat() {
    let r: LocationResponse = serde_json::from_str(r#"{"data":{"geometry":{"coordinates":[6.1,46.2,400]},"properties":{"heading":"90"}}}"#).unwrap();
    let p = r.parsed().unwrap(); assert_eq!((p.longitude, p.latitude), (6.1, 46.2)); assert_eq!(p.heading, Some(90.0));
}
#[test] fn unknown_fields_are_ignored_everywhere() {
    let d: Envelope<Doors> = serde_json::from_str(r#"{"data":{"centralLock":{"value":"LOCKED","updatedAt":"t"},"newThing":1}}"#).unwrap();
    assert_eq!(d.data.unwrap().central_lock.unwrap().value, "LOCKED");
}
```

- [ ] **Step 2: Run to verify failure** — `cargo test models` → compile error.
- [ ] **Step 3: Implement** `models.rs`.
- [ ] **Step 4: Run to verify pass** — `cargo test models` → all passed.
- [ ] **Step 5: Commit**

```bash
git add desktop/src/api
git commit -m "feat(desktop): serde models for every Volvo read and command response"
```

---

### Task 6: API client with 401 refresh-and-retry, and command semantics

**Files:**
- Create: `desktop/src/api/client.rs`, `desktop/src/api/commands.rs`, `desktop/src/api/error.rs`

**Interfaces:**
- `error::ApiError` enum (`thiserror`): `Http { status: u16, code: Option<String>, message: String }`, `Network(String)`, `SessionExpired(String)`, `NotConfigured(String)`; `fn kind(&self) -> ErrorKind` where `ErrorKind = Session | Transient | Api` with the phone's rules: 401 or `SessionExpired` → Session; `Network` → Transient; everything else (incl. 403) → Api. `fn region_hint(&self) -> Option<&'static str>`: for 403 whose message contains "not allowed to access" → `"This API is not available for your vehicle's market."`.
- `client::VolvoClient::new(http: reqwest::Client, base: String, vcc_api_key: String)`; `async fn get<T: DeserializeOwned>(&self, path: &str, token: &str) -> Result<T, ApiError>`; `async fn post_json<T>(&self, path, token, body: &serde_json::Value) -> Result<T, ApiError>`. On non-2xx, parse Volvo's error envelope (`{"error":{"message","description"}}` or `{"message"}`) into `Http`. The 401 → refresh → retry policy lives in the worker (Task 9), so the client itself never refreshes; it just reports 401 as `Http { status: 401, .. }`.
- `commands::CommandName` enum with the ten variants and `fn path(&self) -> &'static str` (kebab-case), `fn from_api_name(s: &str) -> Option<CommandName>` (upper snake, `SEND_NAVI_POI` → None), `fn label(&self) -> &'static str` (Lock, Lock (reduced guard), Unlock, Honk, Flash, Honk and flash, Start climatisation, Stop climatisation, Start engine, Stop engine).
- `commands::Bucket = Success | Pending | UserActionable | Failure`; `fn bucket_of(status: &str) -> Bucket` with exactly the table in `src/api/commands.ts`; `fn friendly_message(status: &str, fallback: Option<&str>) -> String` with the same `FRIENDLY` strings; unknown status → lower-cased with underscores replaced.
- `commands::humanize_reason(raw: &str) -> String` with the phone's `humanizeReason` rules.

- [ ] **Step 1: Write the failing tests**

```rust
#[test] fn bucket_table_matches_phone() {
    assert_eq!(bucket_of("DELIVERED"), Bucket::Success); assert_eq!(bucket_of("CAR_IN_SLEEP_MODE"), Bucket::Pending);
    assert_eq!(bucket_of("NOT_ALLOWED_PRIVACY_ENABLED"), Bucket::UserActionable); assert_eq!(bucket_of("CAR_ERROR"), Bucket::Failure);
    assert_eq!(bucket_of("SOMETHING_NEW"), Bucket::Failure);
}
#[test] fn friendly_messages() {
    assert_eq!(friendly_message("UNABLE_TO_LOCK_DOOR_OPEN", None), "A door is open — close it and try again.");
    assert_eq!(friendly_message("WEIRD_STATE", Some("fallback")), "fallback");
    assert_eq!(friendly_message("WEIRD_STATE", None), "weird state");
}
#[test] fn api_names_map_to_paths() {
    assert_eq!(CommandName::from_api_name("HONK_AND_FLASH"), Some(CommandName::HonkFlash));
    assert_eq!(CommandName::HonkFlash.path(), "honk-flash");
    assert_eq!(CommandName::from_api_name("SEND_NAVI_POI"), None);
}
#[test] fn error_kinds() {
    assert_eq!(ApiError::Http { status: 401, code: None, message: "x".into() }.kind(), ErrorKind::Session);
    assert_eq!(ApiError::Http { status: 403, code: None, message: "Client not allowed to access Location API".into() }.kind(), ErrorKind::Api);
    assert_eq!(ApiError::Network("dns".into()).kind(), ErrorKind::Transient);
}
#[tokio::test] async fn get_sets_headers_and_parses_error_envelope() {
    let server = httpmock::MockServer::start();
    server.mock(|w, t| { w.method("GET").path("/connected-vehicle/v2/vehicles").header("authorization", "Bearer T").header("vcc-api-key", "K").header("accept", "application/json");
        t.status(403).json_body(serde_json::json!({"error":{"message":"Forbidden","description":"Client not allowed to access Location API"}})); });
    let c = VolvoClient::new(reqwest::Client::new(), server.base_url(), "K".into());
    let e = c.get::<serde_json::Value>("/connected-vehicle/v2/vehicles", "T").await.unwrap_err();
    match e { ApiError::Http { status, message, .. } => { assert_eq!(status, 403); assert!(message.contains("not allowed")); } _ => panic!() }
}
```

- [ ] **Step 2: Run to verify failure** — `cargo test api` → compile error.
- [ ] **Step 3: Implement** the three files.
- [ ] **Step 4: Run to verify pass** — `cargo test api` → all passed.
- [ ] **Step 5: Commit**

```bash
git add desktop/src/api
git commit -m "feat(desktop): Volvo API client, error classification and command semantics"
```

---

### Task 7: Resource cache and refresh scheduling (pure)

**Files:**
- Create: `desktop/src/state/mod.rs`, `desktop/src/state/cache.rs`, `desktop/src/state/schedule.rs`, `desktop/src/state/climate.rs`

**Interfaces:**
- `cache::Resource` enum: `Details, Doors, Windows, Fuel, Odometer, Tyres, Diagnostics, Accessibility, EngineStatus, EngineDiag, Brakes, Warnings, Statistics, CommandList, EnergyState, EnergyCaps, Location`; `fn stale_after(&self) -> Duration` per the spec: 30 s for Doors, Windows, Accessibility, EngineStatus; 60 s for Fuel, Location, EnergyState; 300 s for Odometer, Tyres, Diagnostics, Statistics, Brakes, EngineDiag, Warnings; 3600 s for Details; 86 400 s for EnergyCaps and CommandList. `fn path(&self, vin: &str) -> String` giving the full API path (`/connected-vehicle/v2/vehicles/{vin}/doors`, `/energy/v2/vehicles/{vin}/state`, `/location/v1/vehicles/{vin}/location`, `/connected-vehicle/v2/vehicles/{vin}` for Details, `…/capabilities` for EnergyCaps, `…/commands` for CommandList). `Resource::ALL: [Resource; 17]`.
- `cache::Entry { value: Result<serde_json::Value, String>, fetched_at: Instant }`; `cache::VehicleCache { entries: HashMap<Resource, Entry> }` with `fn is_stale(&self, r: Resource, now: Instant) -> bool` (missing = stale), `fn due(&self, now: Instant, force: bool) -> Vec<Resource>`, `fn put(&mut self, r, value, now)`.
- `schedule::Activity { last_input: Instant, focused: bool, minimised: bool }` and `schedule::tick_interval(a: &Activity, now: Instant) -> Option<Duration>`: `None` when minimised; `Some(300 s)` when `now - last_input >= 300 s`; else `Some(60 s)`; unfocused counts as idle. `schedule::Scheduler { last_tick: Option<Instant> }` with `fn should_tick(&mut self, a: &Activity, now: Instant) -> bool`.
- `climate::CLIMATE_DURATION_MS: i64 = 30 * 60_000`, `fn is_active(started_at_ms: Option<i64>, now_ms: i64) -> bool`, `fn remaining_ms(started_at_ms: Option<i64>, now_ms: i64) -> i64`, `fn purge(map: &mut BTreeMap<String, i64>, now_ms: i64)` dropping stale or future entries (the phone's `onRehydrateStorage` rules).

- [ ] **Step 1: Write the failing tests**

```rust
#[test] fn stale_times_match_spec() { assert_eq!(Resource::Doors.stale_after(), Duration::from_secs(30)); assert_eq!(Resource::Details.stale_after(), Duration::from_secs(3600)); assert_eq!(Resource::CommandList.stale_after(), Duration::from_secs(86_400)); }
#[test] fn paths() { assert_eq!(Resource::Location.path("V"), "/location/v1/vehicles/V/location"); assert_eq!(Resource::Details.path("V"), "/connected-vehicle/v2/vehicles/V"); }
#[test] fn due_returns_missing_and_stale_only() {
    let t0 = Instant::now(); let mut c = VehicleCache::default();
    c.put(Resource::Doors, Ok(serde_json::json!({})), t0);
    let due = c.due(t0 + Duration::from_secs(10), false);
    assert!(!due.contains(&Resource::Doors)); assert!(due.contains(&Resource::Windows));
    assert!(c.due(t0 + Duration::from_secs(31), false).contains(&Resource::Doors));
    assert_eq!(c.due(t0, true).len(), Resource::ALL.len());
}
#[test] fn tick_interval_rules() {
    let now = Instant::now(); let a = Activity { last_input: now, focused: true, minimised: false };
    assert_eq!(tick_interval(&a, now), Some(Duration::from_secs(60)));
    assert_eq!(tick_interval(&a, now + Duration::from_secs(300)), Some(Duration::from_secs(300)));
    assert_eq!(tick_interval(&Activity { focused: false, ..a }, now), Some(Duration::from_secs(300)));
    assert_eq!(tick_interval(&Activity { minimised: true, ..a }, now), None);
}
#[test] fn scheduler_ticks_once_per_interval() {
    let now = Instant::now(); let a = Activity { last_input: now, focused: true, minimised: false }; let mut s = Scheduler::default();
    assert!(s.should_tick(&a, now)); assert!(!s.should_tick(&a, now + Duration::from_secs(59))); assert!(s.should_tick(&a, now + Duration::from_secs(60)));
}
#[test] fn climate_math_matches_phone() {
    assert!(is_active(Some(1_000), 1_000 + CLIMATE_DURATION_MS - 1)); assert!(!is_active(Some(1_000), 1_000 + CLIMATE_DURATION_MS));
    assert!(!is_active(Some(2_000), 1_000)); assert_eq!(remaining_ms(Some(2_000), 1_000), 0);
    let mut m = BTreeMap::from([("A".to_string(), 1_000i64), ("B".to_string(), 10_000_000i64)]); purge(&mut m, 5_000_000); assert_eq!(m.len(), 0);
}
```

- [ ] **Step 2: Run to verify failure** — `cargo test state` → compile error.
- [ ] **Step 3: Implement** the four files.
- [ ] **Step 4: Run to verify pass** — `cargo test state` → 6 passed.
- [ ] **Step 5: Commit**

```bash
git add desktop/src/state
git commit -m "feat(desktop): resource cache, refresh budget and climate timer logic"
```

---

### Task 8: Charging stations (Overpass) and geo handoff

**Files:**
- Create: `desktop/src/api/overpass.rs`, `desktop/src/open.rs`

**Interfaces:**
- `overpass::ChargingStation { id: String, latitude: f64, longitude: f64, name: Option<String>, address: Option<String>, operator: Option<String>, usage_type: Option<String>, connections: Vec<Connection { kind: String, power_kw: Option<f64>, quantity: Option<u32> }> }`.
- `overpass::parse(body: &str) -> Vec<ChargingStation>` applying the phone's `composeAddress`, `prettyAccess` and `collectConnections` rules (read `src/api/chargingStations.ts` for the tag names: `socket:*` tags give connection kind and quantity, `socket:*:output` gives power).
- `async fn overpass::fetch(http: &reqwest::Client, lat: f64, lon: f64, radius_m: u32) -> Result<Vec<ChargingStation>, ApiError>` POSTing `data=<query>` to `https://overpass-api.de/api/interpreter` with the phone's query string.
- `open::geo(lat: f64, lon: f64)` runs `xdg-open geo:lat,lon` and, if that exits non-zero, `xdg-open https://www.openstreetmap.org/?mlat=lat&mlon=lon#map=16/lat/lon`; `open::url(u: &str)` runs `xdg-open u`. Both detach (`std::process::Command::spawn`), returning `io::Result<()>`.

- [ ] **Step 1: Write the failing tests** for `parse` using a fixture with two nodes: one with `name`, `operator`, `addr:*`, `access=customers`, `socket:type2=2`, `socket:type2:output=22 kW`; one node lacking tags → `name: None`, `connections` empty. Assert `usage_type == Some("Customers only")`, `address == Some("12 Rue X, 1200 Geneva")`, `connections[0] == Connection { kind: "type2", power_kw: Some(22.0), quantity: Some(2) }`.
- [ ] **Step 2: Run to verify failure** — `cargo test overpass` → compile error.
- [ ] **Step 3: Implement** both files.
- [ ] **Step 4: Run to verify pass** — `cargo test overpass` → passed.
- [ ] **Step 5: Commit**

```bash
git add desktop/src/api/overpass.rs desktop/src/open.rs desktop/src/main.rs
git commit -m "feat(desktop): charging stations from Overpass and xdg-open handoff"
```

---

### Task 9: Worker thread: session, refresh loop, commands

**Files:**
- Create: `desktop/src/worker/mod.rs`, `desktop/src/worker/session.rs`, `desktop/src/worker/messages.rs`

**Interfaces:**
- `messages::UiRequest` enum: `StartSignIn { prompt_login: bool }`, `FinishSignIn { callback_url: String }`, `SignOut`, `SaveConfig(Config)`, `SelectVehicle(String)`, `Refresh { vin: String, force: bool }`, `LoadGarage`, `Command { vin: String, command: CommandName, runtime_minutes: Option<u8> }`, `FetchChargers { lat: f64, lon: f64 }`, `Activity(Activity)`.
- `messages::WorkerEvent` enum: `SignedOut`, `SignedIn`, `SignInError(String)`, `AuthorizeUrlOpened(String)`, `Garage(Vec<VehicleListItem>)`, `GarageError(String)`, `Resource { vin: String, resource: Resource, value: Result<serde_json::Value, String> }`, `CommandResult { vin: String, command: CommandName, status: String, message: Option<String>, bucket: Bucket, ready_to_unlock_until: Option<i64> }`, `CommandError { command: CommandName, message: String }`, `Chargers(Result<Vec<ChargingStation>, String>)`, `SessionExpired(String)`, `Offline(bool)`, `ClimateStarted { vin: String, at_ms: i64 }`, `ClimateStopped { vin: String }`.
- `worker::spawn(paths: Paths, config: Config, tokens: Option<Tokens>, ipc_rx: std::sync::mpsc::Receiver<String>, repaint: impl Fn() + Send + 'static) -> (std::sync::mpsc::Sender<UiRequest>, std::sync::mpsc::Receiver<WorkerEvent>)`: starts a thread running a tokio runtime; `repaint` is called after every event so egui wakes (`ctx.request_repaint()`).
- Adds the variant `AuthError::NoPendingSignIn` to Task 3's enum (message below).
- `session::Session { config, tokens: Option<Tokens>, pending: Option<PendingSignIn>, http, endpoint: TokenEndpoint, expired: bool }` with `async fn access_token(&mut self) -> Result<String, ApiError>` (refresh when `needs_refresh`; on refresh failure: clear tokens, `expired = true`, return `SessionExpired`), `async fn with_retry<T>(&mut self, f) -> Result<T, ApiError>` that on `Http { status: 401 }` refreshes once and retries once, and `fn finish_sign_in(&mut self, url: &str) -> Result<(String /*code*/, PendingSignIn), AuthError>` which errors `AuthError::NoPendingSignIn` (message `Start sign-in from this window, then return here.`) when `pending` is `None` and leaves `pending` untouched on `StateMismatch`.
- Refresh loop: every 1 s the worker checks `Scheduler::should_tick`; on tick, for the selected VIN, fetch every `due` resource concurrently (bounded to 4 at a time), emitting one `Resource` event each. `Refresh { force: true }` fetches all. After a `CommandResult` with bucket Success or Pending, schedule a forced refresh of that VIN after 5 s. When `expired` is true, ticks do nothing until `SignedIn`.
- Commands: POST `{}` or `{"runtimeMinutes": n}`; on accepted `climatization-start` store `climate_started_at[vin] = now_ms` in tokens.json and emit `ClimateStarted`; on accepted `climatization-stop` remove and emit `ClimateStopped`.

- [ ] **Step 1: Write the failing tests** (session logic, `httpmock`):

```rust
#[tokio::test] async fn with_retry_refreshes_once_on_401() {
    // token endpoint returns a new token; API returns 401 then 200. Assert the API was hit twice and the second call carried "Bearer NEW".
}
#[tokio::test] async fn refresh_failure_sets_session_expired_and_stops_polling() {
    // token endpoint returns 400 invalid_grant with an expired access token in Session. access_token() must return ApiError::SessionExpired, session.expired == true, tokens == None, and a second access_token() call must not hit the token endpoint again (mock hits == 1).
}
#[test] fn finish_sign_in_without_pending_flow_errors() {
    // Session with pending None: finish_sign_in("volvo-companion://oauth/callback?code=c&state=s") → Err(AuthError::NoPendingSignIn)
}
#[test] fn finish_sign_in_keeps_pending_on_state_mismatch() {
    // pending state "A", callback state "B" → Err(StateMismatch) and session.pending.is_some()
}
```

Write the bodies from the comments.

- [ ] **Step 2: Run to verify failure** — `cargo test worker` → compile error.
- [ ] **Step 3: Implement** the worker.
- [ ] **Step 4: Run to verify pass** — `cargo test worker` → 4 passed; `cargo clippy --all-targets -- -D warnings` clean.
- [ ] **Step 5: Commit**

```bash
git add desktop/src/worker desktop/src/main.rs
git commit -m "feat(desktop): background worker with session refresh, polling budget and commands"
```

---

### Task 10: App shell, sidebar, sign-in and settings screens

**Files:**
- Create: `desktop/src/app.rs`, `desktop/src/ui/mod.rs`, `desktop/src/ui/sidebar.rs`, `desktop/src/ui/sign_in.rs`, `desktop/src/ui/settings.rs`, `desktop/src/ui/widgets.rs`
- Modify: `desktop/src/main.rs` (construct `App`, wire ipc listener + worker, handle `initial_callback`)

**Interfaces:**
- `app::App` implements `eframe::App`; holds `tx: Sender<UiRequest>`, `rx: Receiver<WorkerEvent>`, `config: Config`, `signed_in: bool`, `session_expired: Option<String>`, `garage: Vec<VehicleListItem>`, `selected_vin: Option<String>`, `caches: HashMap<String, VehicleCache>`, `screen: Screen { Dashboard, Settings }`, `banner: Option<(Level, String)>`, `sign_in_form: SignInForm`, plus per-dashboard state from Task 11. `update()` drains `rx` first, then tracks `Activity` from `ctx.input()` (any pointer or key event updates `last_input`; `ctx.input(|i| i.viewport().focused)`, `minimized`) and sends `UiRequest::Activity` when it changes, then draws.
- `widgets::field(ui, label, value: &mut String, password: bool)`, `widgets::notice(ui, title, body, level: Level)` (`Level = Info | Warn | Danger`, colours accent/amber/red), `widgets::primary_button(ui, label) -> bool`, `widgets::section_title(ui, text)` (upper-case, muted, letter-spaced).
- `sign_in::show(ui, form: &mut SignInForm, cfg: &Config) -> Option<SignInAction>` where `SignInAction = Connect(Config) | FinishWithUrl(String)`; shows the five fields, the default-bridge warning when `redirect_uri` is empty or default, the `dc-` warning when `is_legacy_client_id`, **Connect Volvo account**, and the paste field with **Finish sign-in**. Copy for the notices is the phone's sign-in screen text.
- `settings::show(ui, draft: &mut Config, garage: &[VehicleListItem]) -> Option<SettingsAction>` where `SettingsAction = Save(Config) | Cancel`; fields: the five credentials, `Tile URL template`, and per car a name field and an `Electric vehicle` checkbox; the trademark paragraph from `TRADEMARKS.md`'s first sentence at the bottom.
- `sidebar::show(ui, app_state) -> Option<SidebarAction>` where `SidebarAction = Select(String) | Refresh | Settings | SignOut`; car label = `vehicle_prefs[vin].name` else `"{model_year} {model}"` from the Details cache else the VIN.
- On `SettingsAction::Save`, if client id, secret, VCC key or scopes changed and signed in → send `SignOut` then `SaveConfig`, banner "Configuration changed — you've been signed out. Connect again to issue a token with the new settings."

- [ ] **Step 1: Implement** the files. No unit tests; UI.
- [ ] **Step 2: Verify by running**

Run: `cd desktop && cargo run` then, in another shell: `cargo run -- "volvo-companion://oauth/callback?code=x&state=y"`.
Expected: the window shows the sign-in screen with your saved config fields empty on first run; the second command exits immediately and the window shows the banner "Start sign-in from this window, then return here." (no pending flow). Fill the fields with the phone's values (the `vid-dcr-` client), press Connect: the browser opens Volvo's login; after login the window moves to the dashboard shell (empty sections are fine at this task).

- [ ] **Step 3: Commit**

```bash
git add desktop/src
git commit -m "feat(desktop): app shell with sidebar, sign-in and settings screens"
```

---

### Task 11: Dashboard: header, status cards, car top view, tyres

**Files:**
- Create: `desktop/src/ui/dashboard.rs`, `desktop/src/ui/car_view.rs`, `desktop/src/ui/cards.rs`, `desktop/src/warnings.rs`

**Interfaces:**
- `warnings::describe(field: Option<&RString>) -> (String, Level3)` with `Level3 = Ok | Warn | Unknown` and the same rules as the phone plan Task 4 (`NO_WARNING|NONE|OK` → `("OK", Ok)`, `UNSPECIFIED`/missing → `("—", Unknown)`, else humanised text, `Warn`); `warnings::active(map: &BTreeMap<String, RString>) -> Vec<(String /*label*/, String /*text*/)>`; `warnings::humanize_key(k: &str) -> String`; `warnings::engine_label(field: Option<&RString>) -> Option<&'static str>` (`RUNNING` → "Engine running", `STOPPED` → "Engine off").
- `cards::status_card(ui, label, value: &str, accent: Option<Color32>)`, `cards::battery_card(ui, percent: Option<f64>, caption: &str)` (thin green bar), `cards::lock_card(ui, lock: Option<&str>) -> bool` (returns true when clicked; shows "Locked"/"Unlocked" and "Tap to unlock"/"Tap to lock").
- `car_view::CarView` loads `../../assets/volvo-top-black.png` once via `include_bytes!` + `image` into an `egui::TextureHandle`; `fn show(&mut self, ui, doors: Option<&Doors>, windows: Option<&Windows>, is_ev: bool, width: f32)` draws the image and the overlays with the phone's rectangles (door coordinates from `CarTopView.tsx`, window coordinates from the phone plan Task 3) scaled from the 588×1030 space; closed green `rgba(52,211,153,0.55)`, open red `rgba(239,68,68,0.85)`, unknown transparent.
- `dashboard::show(ui, state: &mut DashboardState, caches, cfg, ...) -> Vec<DashboardAction>` where actions include `Command(CommandName, Option<u8>)`, `RefreshLocation`, `ToggleChargers`, `OpenInMaps(f64, f64)`, `OpenStation(f64, f64)`. This task draws the header (model line, colour · gearbox · availability · engine label · "updated hh:mm" from the newest `fetched_at`), the status cards row (Lock, Battery, Range, Odometer, Fuel unless EV, Service), the car view and the four tyre cells (phone's `TyreStatus` colour rules: `NO_SENSOR`/`UNSPECIFIED` → unknown, pressure strings containing `LOW`/`HIGH`/`WARNING` → warn, else ok). Remaining rows come in Tasks 12 and 13.

- [ ] **Step 1: Write the failing tests** for `warnings.rs` (port the phone plan's Task 4 and Task 5 assertions to Rust).
- [ ] **Step 2: Run to verify failure** — `cargo test warnings` → compile error.
- [ ] **Step 3: Implement** `warnings.rs`, then the UI files.
- [ ] **Step 4: Run to verify pass** — `cargo test warnings` → passed.
- [ ] **Step 5: Verify by running** — `cargo run`, signed in: the XC40 header, six cards with live values, the car image with green door overlays and four tyre cells.
- [ ] **Step 6: Commit**

```bash
git add desktop/src
git commit -m "feat(desktop): dashboard header, status cards, car top view and tyres"
```

---

### Task 12: Dashboard: map with chargers, energy, health and trip rows

**Files:**
- Create: `desktop/src/ui/map.rs`, `desktop/src/ui/energy.rs`, `desktop/src/ui/health.rs`
- Modify: `desktop/src/ui/dashboard.rs`

**Interfaces:**
- `map::MapPanel { memory: walkers::MapMemory, tiles: Option<walkers::HttpTiles>, chargers_on: bool, selected_station: Option<usize> }` with `fn configure(&mut self, ctx, tile_template: Option<&str>, cache_dir: &Path)` (rebuilds tiles when the template changes; `HttpTiles` with the User-Agent from Global Constraints) and `fn show(&mut self, ui, location: Option<&ParsedLocation>, stations: &[ChargingStation], updated: Option<&str>) -> Vec<DashboardAction>`. With no template: a card reading "No tile server configured" with the button **Use OpenStreetMap tiles** (sets `tile_url_template = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"` through a `DashboardAction::SetTileTemplate(String)`) and a link "OSM tile usage policy" to `https://operations.osmfoundation.org/policies/tiles/`. With a template: the map centred on the car with a green marker, station markers when `chargers_on`, buttons **Open in maps**, **Refresh**, **Chargers** toggle, and the station detail card (name, operator, address, distance, usage type, connectors) on click.
- `energy::show(ui, state: Option<&EnergyState>, caps: Option<&EnergyCapabilities>)`: seven cards with the phone's labels (Charger, Charging, Charge type, Charging power, Target SoC, Time to target, Current limit), greyed (alpha 0.4) when `caps.is_supported(field) == Some(false)` or when not plugged in for the plugged-in-only ones (phone rule). Power formatted as `kW` with one decimal when ≥ 1000 W.
- `health::show_health(ui, engine: Option<&EngineDiagnostics>, brakes: Option<&Brakes>, warnings: Option<&BTreeMap<String, RString>>)`: cards Oil level, Coolant level, Brake fluid with `warnings::describe` (green text for Ok, amber for Warn), then active warnings or a "Lights — No warnings" card.
- `health::show_trip(ui, stats: Option<&Statistics>)`: Trip meter 1, Trip meter 2, Average speed, Fuel consumption, Distance to empty via `models::render`; the row is skipped when `stats` is `None`.

- [ ] **Step 1: Implement** the three files and insert the rows into `dashboard.rs` in the spec order (middle row: car view + tyres left, map right; then energy; then health; then trip).
- [ ] **Step 2: Verify by running** — `cargo run`: map card shows the OSM opt-in; clicking it renders tiles with the car marker at its last position; **Chargers** shows markers within 5 km; the energy row shows battery data for the XC40; health shows OK tiles; trip shows values or is absent.
- [ ] **Step 3: Commit**

```bash
git add desktop/src
git commit -m "feat(desktop): map with charger overlay, energy, health and trip rows"
```

---

### Task 13: Dashboard: command bar, banners, confirmations

**Files:**
- Create: `desktop/src/ui/commands_bar.rs`
- Modify: `desktop/src/ui/dashboard.rs`, `desktop/src/app.rs`

**Interfaces:**
- `commands_bar::State { engine_minutes: u8 (default 5), confirm: Option<CommandName>, flash: Option<(CommandName, bool /*success*/, Instant)>, unlock_until_ms: Option<i64>, privacy_blocked: bool }`.
- `commands_bar::show(ui, st: &mut State, availability: Option<&Availability>, supported: Option<&HashSet<CommandName>>, is_ev: bool, climate_started_ms: Option<i64>, now_ms: i64) -> Option<(CommandName, Option<u8>)>`. Layout: availability dot (green `AVAILABLE`, amber otherwise) + text; unlock-ready banner "Ready to unlock — pull a door handle within N s" while `unlock_until_ms > now`; climate banner "Climatisation running — about N min left" + the phone's disclaimer sentence; privacy sticky banner with `humanize_reason("PRIVACY_ENABLED")`; block banner for non-AVAILABLE reasons. Two rows of buttons: Lock, Lock (reduced guard), Unlock, Honk, Flash, Honk and flash / Start climatisation, Stop climatisation (enabled only while climate active), Engine start with a `1..=15` slider labelled "Run for N min", Stop engine. Engine buttons hidden when `is_ev`. A button is disabled when availability ≠ AVAILABLE, when `privacy_blocked`, or when `supported` is non-empty and lacks it (label suffix " — not supported"). Unlock, Lock (reduced guard) and Engine start open a confirmation modal with the phone's titles and messages; confirming returns the command. Buttons flash green or red for 1.2 s after `CommandResult`/`CommandError` (`flash`).
- `app.rs` handles `CommandResult`: bucket Success/Pending → green flash; `NOT_ALLOWED_PRIVACY_ENABLED` → `privacy_blocked = true`; UserActionable/Failure → red flash and banner `friendly_message`; unlock → `unlock_until_ms`; any success clears `privacy_blocked`.

- [ ] **Step 1: Implement** the file and wiring.
- [ ] **Step 2: Verify by running** — `cargo run`: press **Start climatisation** → green flash, climate banner appears, after ~5 s the status cards refresh; **Stop climatisation** → banner clears. **Unlock** → confirmation modal → green flash and the unlock-ready banner.
- [ ] **Step 3: Commit**

```bash
git add desktop/src
git commit -m "feat(desktop): command bar with confirmations, unlock window and climate banner"
```

---

### Task 14: Release pipeline and README

**Files:**
- Modify: `.github/workflows/release.yml`
- Modify: `README.md` (new "Linux desktop" section after "Configure at runtime"; a line in "Features")
- Create: `desktop/packaging/check-version.sh`

**Interfaces:**
- `check-version.sh TAG`: exits 1 with `::error::desktop/Cargo.toml version X does not match tag TAG` unless `grep '^version' desktop/Cargo.toml` equals the tag without the leading `v`.

- [ ] **Step 1: Add the `desktop` job** to `release.yml`, between `build` and `release`:

```yaml
  desktop:
    runs-on: ubuntu-22.04
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4
      - name: Check version matches tag
        run: bash desktop/packaging/check-version.sh "${GITHUB_REF_NAME}"
      - name: Install build dependencies
        run: sudo apt-get update && sudo apt-get install -y libxkbcommon-dev libwayland-dev libgl1-mesa-dev libfontconfig1-dev
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy, rustfmt
      - uses: Swatinem/rust-cache@v2
        with:
          workspaces: desktop
      - name: Install cargo-deb
        run: cargo install cargo-deb --locked
      - name: Format, lint, test
        working-directory: desktop
        run: cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test
      - name: Build deb
        working-directory: desktop
        run: cargo deb && ls target/debian/
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
        with:
          name: vlv-companion-${{ github.ref_name }}-deb
          path: desktop/target/debian/*.deb
```

Pin the two new actions to commit SHAs in the same style as the existing ones (`gh api repos/dtolnay/rust-toolchain/commits/stable` and `.../Swatinem/rust-cache/commits/v2` give the SHAs). The `release` job: `needs: [build, desktop]`, a second `download-artifact` step for the deb artifact, and `files: |` listing `vlv-companion-*.apk` and `*.deb`.

- [ ] **Step 2: Write `check-version.sh`** and make it executable.
- [ ] **Step 3: Verify the script**

Run: `bash desktop/packaging/check-version.sh v1.0.2; echo "exit=$?"; bash desktop/packaging/check-version.sh v9.9.9; echo "exit=$?"`
Expected: `exit=0` then an `::error::` line and `exit=1`.

- [ ] **Step 4: Verify the workflow file parses**

Run: `python3 -I -c "import yaml,sys; d=yaml.safe_load(open('.github/workflows/release.yml')); print(list(d['jobs']), d['jobs']['release']['needs'])"`
Expected: `['build', 'desktop', 'release'] ['build', 'desktop']`.

- [ ] **Step 5: README.** Add to Features: `- Linux desktop client (Rust, egui) with the same sign-in and the same dashboard data, shipped as a .deb.` Add a "Linux desktop" section covering: install (`sudo apt install ./vlv-companion_<ver>_amd64.deb`), first launch and sign-in through the bridge, the custom-scheme handler and the paste-URL fallback, where config and tokens live (paths and 0600), the tile-server opt-in, the refresh budget (60 s focused, 5 min idle, none minimised), and local build commands (`cd desktop && cargo run`, `cargo deb`). Mention the APK and the .deb are released together and a release only exists when both built.
- [ ] **Step 6: Commit**

```bash
git add .github/workflows/release.yml README.md desktop/packaging/check-version.sh
git commit -m "ci: build and release the Linux .deb alongside the APK"
```

---

### Task 15: Install the .deb and verify end to end

**Files:** none.

- [ ] **Step 1: Build and install locally**

Run: `cd desktop && cargo deb && sudo apt install -y ./target/debian/vlv-companion_1.0.2-1_amd64.deb && xdg-mime query default x-scheme-handler/volvo-companion`
Expected: `vlv-companion.desktop`.

- [ ] **Step 2: Sign in from the installed binary.** Run `vlv-companion` from a terminal, sign out if signed in, press Connect, complete the Volvo login in the browser. Expected: the browser hands off to the app automatically (window shows the dashboard); if the browser asks whether to open the link, accept once. Then test the fallback: sign out, Connect, copy the final `volvo-companion://…` URL from the browser's address bar or the bridge page's "Open the app" link, paste it into the field, press Finish sign-in → dashboard.
- [ ] **Step 3: Exercise every section** as in Tasks 11–13 and leave the window focused for 35 minutes; the header's "updated" time must keep advancing and no session-expired banner must appear (token refresh works). Minimise for 2 minutes: no requests (watch with `strace -f -e trace=connect -p $(pgrep vlv-companion) 2>&1 | grep -c 443` before and after, or simply the "updated" time holding).
- [ ] **Step 4: Report** what passed and what did not; nothing to commit unless fixes were needed.
