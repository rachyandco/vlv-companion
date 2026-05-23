# Publishing Vlv Companion on f-droid.org

**Status:** Draft — awaiting user review
**Date:** 2026-05-23
**Scope:** First-time submission of `app.volvocompanion` (v1.0.0) to the official
f-droid.org repository.

## 1. Goal

Make Vlv Companion installable via the official F-Droid client and indexable on
f-droid.org, without breaking the existing GitHub-Releases distribution channel
or the OAuth flow registered with the Volvo developer portal.

Non-goals: self-hosted F-Droid repo, reproducible-builds signature continuity,
multi-locale metadata, F-Droid feature-graphic banner. These are deferred.

## 2. Distribution path

Submit a Merge Request to `gitlab.com/fdroid/fdroiddata` adding a new package
entry. F-Droid's build server compiles from source on each new tag and signs
with F-Droid's key.

The trade-off accepted here: users who installed the APK from GitHub Releases
will not be able to update via F-Droid in place — the signing certificates
differ, so the OS treats the F-Droid APK as a different app and requires
uninstall + reinstall. This is the normal first-submission state. Closing the
gap is a future "reproducible builds" effort, out of scope.

## 3. Naming and trademark posture

Submit as **Vlv Companion**, defending the abbreviated reference as descriptive
fair use. The `TRADEMARKS.md` notice already in the repo and the lead
paragraph of the F-Droid description (see §6) are the primary defense.

A prepared fallback exists in case reviewers object:

- **Fallback name:** `VCompanion`
- **What changes:** display name only — `app.config.ts` `name` field and
  `metadata/.../en-US/title.txt`.
- **What does *not* change:** `applicationId = app.volvocompanion`, the OAuth
  scheme `volvo-companion://oauth/callback`, the redirect bridge URL
  registered in the Volvo developer portal, the signing keystore on GitHub
  Releases, the "VC" icon (it reads naturally for VCompanion).
- **Mechanics:** held on a `fdroid-rename-fallback` branch (one commit, two
  files changed). If the reviewer asks for a rename, the branch is merged
  to master, a new tag `v1.0.1` is cut, and the MR is amended to point at
  the new tag.

## 4. Build recipe

`android/` is committed to the repo (the `expo prebuild` output is in git), so
the F-Droid build server does not run `expo prebuild`. Only the JS bundle is
produced during the Gradle invocation, via the standard React Native
`bundleReleaseJsAndAssets` task.

Proposed `Builds:` entry:

```yaml
Builds:
  - versionName: 1.0.0
    versionCode: 1
    commit: v1.0.0
    sudo:
      - apt-get update
      - apt-get install -y npm
      - npm install -g pnpm@9
    init:
      - pnpm install --frozen-lockfile --ignore-scripts
    subdir: android
    gradle:
      - yes
    output: app/build/outputs/apk/release/app-release.apk
```

Notes:

- `--ignore-scripts` blocks postinstall network access on the F-Droid build
  server (sandboxed, offline). If any package legitimately needs a postinstall
  step, we run it manually under `init:` with a vendored payload — never via
  arbitrary script execution.
- `subdir: android` makes Gradle the build root and matches the existing
  `pnpm android:release` invocation.
- The release APK lands at the same path Gradle already writes to in CI, so no
  divergence between the F-Droid build and the GitHub Releases build except
  for the signing key.

### 4.1 Plan B if pnpm is rejected by the F-Droid reviewer

Some reviewers prefer recipes that stick to packagers already in F-Droid's
build-server base image (npm, yarn). If pnpm is pushed back on:

1. Locally: generate `package-lock.json` from the existing pnpm install.
2. Recipe change: drop the `sudo` block, replace the `init` step with
   `npm ci --ignore-scripts`.
3. Repo change: commit `package-lock.json` alongside `pnpm-lock.yaml`. Keep
   pnpm as the canonical local/CI packager; npm is used only by F-Droid.

This trade is purely about reviewer preference; functionally either works.

## 5. Anti-feature flags

Only one applies:

- **`NonFreeNet`** — required. The Volvo Connected Vehicle / Energy / Location
  developer APIs are a proprietary, single-source, terms-restricted online
  service with no FOSS substitute. The app is unusable without them.

Explicitly evaluated and *not* applied:

- `NonFreeAssets` — OpenFreeMap tiles are open data; MapLibre is FOSS.
- `NonFreeDep` — all npm and Gradle dependencies audited as FOSS-licensed
  (verification step below in §8).
- `Tracking` — no analytics, no telemetry, no crash reporters. ESLint blocks
  Firebase / Sentry / Google Sign-In imports at the source-tree level.
- `KnownVuln` — none known at time of submission.

## 6. Metadata content

### 6.1 `title.txt`

```
Vlv Companion
```

### 6.2 `short_description.txt`

A degoogled-friendly client for the Volvo Cars developer APIs.

### 6.3 `full_description.txt` (sketch)

The first paragraph is the trademark armour and must remain first.

```
Independent project — not affiliated with, endorsed by, sponsored by,
certified by, or otherwise authorised by Volvo Car Corporation, AB Volvo,
Volvo Car USA, LLC, the Volvo Trademark Holding AB, or any other Volvo
company. "Vlv Companion" is a descriptive abbreviation; the names "VOLVO",
the Volvo iron-mark, and any related marks are trademarks of their
respective owners and are referenced here only to factually describe the
vehicles and developer APIs this software interoperates with.

Vlv Companion is a React Native Android client for the Volvo Cars public
developer APIs (Connected Vehicle v2, Energy v2, Location v1). It is
designed for phones running GrapheneOS, /e/OS, CalyxOS, LineageOS-without-
GApps, and similar degoogled stacks. The app uses no Firebase, no Google
Play services, and no Google Maps.

Features:
 - OAuth 2.0 + PKCE sign-in against Volvo ID (EU region).
 - Garage list with per-vehicle name and EV toggle.
 - Per-vehicle screens: Overview (locking, battery, range, odometer, fuel,
   service distance, per-corner tyre pressure), Energy (battery gauge,
   charging status, target SoC, time-to-target), Location (MapLibre +
   OpenFreeMap tiles, handoff to OsmAnd / Organic Maps / Magic Earth via
   geo: URIs), and Commands (lock, unlock, honk, flash, climatisation
   start/stop, engine start/stop).

You must register your own application on developer.volvocars.com and host
a small static HTTPS redirect bridge (provided in the source tree); the
app guides you through this on first launch.
```

### 6.4 Screenshots

Source: `~/Downloads/vlv-img/`. Four PNGs, 720×1560, no watermark. They will
be copied into `metadata/app.volvocompanion/en-US/phoneScreenshots/` with
ordered, descriptive filenames (e.g. `01-overview.png`, `02-energy.png`,
`03-location.png`, `04-commands.png` — exact mapping decided at copy time
from the actual image contents).

One caveat: the visible vehicle nickname in at least one screenshot reads
"Volvo Black" (user-entered data, not app branding). If a reviewer flags
this, re-capture with a generic nickname like "My Car" before resubmitting.
Pre-emptive re-capture is out of scope for this initial MR.

## 7. Metadata recipe fields (full picture)

```yaml
Categories:
  - Connectivity
License: GPL-3.0-or-later
AuthorName: Rachy & Co
AuthorEmail: <to be filled in before MR>
SourceCode: https://github.com/rachyandco/vlv-companion
IssueTracker: https://github.com/rachyandco/vlv-companion/issues
Changelog: https://github.com/rachyandco/vlv-companion/releases

AntiFeatures:
  - NonFreeNet

AutoName: Vlv Companion

RepoType: git
Repo: https://github.com/rachyandco/vlv-companion.git

Builds:
  - versionName: 1.0.0
    versionCode: 1
    commit: v1.0.0
    sudo:
      - apt-get update
      - apt-get install -y npm
      - npm install -g pnpm@9
    init:
      - pnpm install --frozen-lockfile --ignore-scripts
    subdir: android
    gradle:
      - yes
    output: app/build/outputs/apk/release/app-release.apk

AutoUpdateMode: Version v%v
UpdateCheckMode: Tags ^v
CurrentVersion: 1.0.0
CurrentVersionCode: 1
```

Open inputs to gather before the MR:

- `AuthorEmail` — public contact F-Droid will route reviewer comments to.

## 8. Pre-submission verifications

All must pass locally before the MR is opened:

1. **Public tag exists.** `git fetch origin --tags && git rev-parse v1.0.0`
   resolves on `github.com/rachyandco/vlv-companion`.
2. **License file present at repo root.** Already true (`LICENSE`,
   GPL-3.0-or-later).
3. **Issue tracker reachable.** GitHub Issues is enabled on the public repo.
4. **Local F-Droid build green.** Inside the `registry.gitlab.com/fdroid/fdroidserver`
   container, run `fdroid build app.volvocompanion:1.0.0` (no `--on-server`;
   that flag is for the actual build-VM mode and isn't what you want for
   local verification). It must complete with a usable APK.
5. **APK badging sanity check.**
   `aapt dump badging <built.apk>` shows exactly:
   - `package: name='app.volvocompanion' versionCode='1' versionName='1.0.0'`
   - `uses-permission: name='android.permission.INTERNET'` and no others
     (no `ACCESS_*_LOCATION`, no `READ/WRITE_EXTERNAL_STORAGE`, no
     `BIND_GET_INSTALL_REFERRER_SERVICE`).
6. **Dependency FOSS audit.** Spot-check `node_modules` and Gradle deps for
   any non-FOSS licenses. The dependency list in `package.json` is short
   enough to eyeball; the gradle side is React Native core + MapLibre, both
   FOSS. Document findings in the MR description if anything looks ambiguous.

## 9. Risks and mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Reviewer objects to "Vlv" as trademark obfuscation | Medium | Fallback rename branch ready (§3); MR amended in <10 minutes |
| Reviewer objects to pnpm in build recipe | Medium | Plan B (§4.1) switches to npm ci with committed `package-lock.json` |
| `android/` committed tree drifts from `expo prebuild --no-install` output | Low–Medium | CI guard recommended (out of scope here; tracked as a follow-up TODO) |
| Reviewer objects to "Volvo Black" nickname visible in screenshot | Low | Re-capture with generic nickname; cheap fix |
| `--ignore-scripts` breaks something that needs a postinstall | Low–Medium | Identify the offender from the build log; replace with a vendored manual step under `init:` |
| F-Droid build fails for an unanticipated reason (NDK version, JVM, etc.) | Medium | Local `fdroid build` (§8.4) catches this before MR is opened |

## 10. Future work (explicitly out of scope here)

- **Reproducible builds.** Achieve byte-identical APKs between developer-
  signed (GitHub Releases) and F-Droid-built outputs, then submit a
  reproducible-builds verification so F-Droid distributes the developer-
  signed APK. This closes the signature-continuity gap.
- **CI guard against `android/` drift.** Run `pnpm prebuild --no-install` in
  CI on master and fail if it produces a non-empty diff.
- **Self-hosted F-Droid repo as a backup channel.** Run `fdroid update` on a
  static host (Cloudflare Pages / GitHub Pages) so users can subscribe to a
  repo URL independently of f-droid.org.
- **Feature graphic** (`featureGraphic.png`) and additional locales.

## 11. Acceptance criteria

This work is "done" when:

1. `metadata/app.volvocompanion.yml` + the en-US metadata bundle is on a
   branch in a fork of `fdroiddata`, the local `fdroid build` succeeds for
   `app.volvocompanion:1.0.0`, and `aapt dump badging` passes the §8.5
   checklist.
2. An MR is opened against `fdroiddata:master` with a description that
   surfaces the trademark fair-use argument and the `NonFreeNet`
   justification.
3. The `fdroid-rename-fallback` branch exists on the `vlv-companion` repo,
   ready to merge if requested.
