# F-Droid Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get Vlv Companion v1.0.0 (`app.volvocompanion`) accepted into the official f-droid.org repository via an MR to `gitlab.com/fdroid/fdroiddata`.

**Architecture:** Two parallel workstreams. (A) In the `vlv-companion` repo: bump version, retag v1.0.0, push, prepare a `fdroid-rename-fallback` branch. (B) In a fork of `fdroiddata`: write the metadata recipe, copy screenshots, lint, build locally with `fdroid build`, sanity-check the APK, push the MR.

**Tech Stack:** `fdroidserver` Python tool, GitLab MR (target: `fdroid/fdroiddata`), Expo SDK 53 + React Native 0.79.6 + Gradle (the existing app build chain — no changes to it).

**Source spec:** `docs/superpowers/specs/2026-05-23-fdroid-publishing-design.md`. Re-read it if any context is missing.

---

## Workstream A — Prepare the `vlv-companion` repository

### Task 1: Bump version to 1.0.0 in app.config.ts

**Files:**
- Modify: `app.config.ts` (the `version` field — currently `"0.1.0"`, set to `"1.0.0"`)

- [ ] **Step 1: Read the current config**

Run: `grep -n 'version' /home/alexis/Apps/vlv-companion/app.config.ts`
Expected: a line `version: "0.1.0",` and a line `versionCode: 1,`. `versionCode` stays at `1`.

- [ ] **Step 2: Apply the edit**

Change the line `version: "0.1.0",` to `version: "1.0.0",` in `app.config.ts`. Leave `versionCode: 1` unchanged — F-Droid keys updates on `versionCode`, not `versionName`, and this is still the first release.

- [ ] **Step 3: Verify the change**

Run: `grep -E 'version' /home/alexis/Apps/vlv-companion/app.config.ts`
Expected output:
```
  version: "1.0.0",
    versionCode: 1,
```

- [ ] **Step 4: Confirm no other files reference the old version**

Run: `grep -rn '"0\.1\.0"\|version: 0\.1\.0' /home/alexis/Apps/vlv-companion --include='*.ts' --include='*.json' --include='*.gradle' --exclude-dir=node_modules --exclude-dir=android/app/build`
Expected: no output. (The `package.json` `version` field can stay at whatever it says; it's the JS package version, not the Android APK version. Only confirm there's no stale `"0.1.0"` in another build-relevant file.)

- [ ] **Step 5: Commit**

```bash
cd /home/alexis/Apps/vlv-companion
git add app.config.ts
git commit -m "$(cat <<'EOF'
Bump versionName to 1.0.0

The existing v1.0.0 tag pointed at code that still declared 0.1.0; this
aligns the manifest with the tag in preparation for F-Droid submission.
versionCode stays at 1 — F-Droid update detection runs off versionCode.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Re-create the v1.0.0 tag at the new commit

**Why:** The existing local `v1.0.0` tag points at the initial commit, which still has `versionName=0.1.0` baked into the APK. After the bump in Task 1, the tag must move so F-Droid checks out a commit whose manifest matches the metadata YAML.

- [ ] **Step 1: Confirm the stale tag still points at the old commit**

Run: `git -C /home/alexis/Apps/vlv-companion show v1.0.0:app.config.ts | grep version:`
Expected: `version: "0.1.0",` — confirming the tag is stale and must be moved.

- [ ] **Step 2: Delete the local v1.0.0 tag**

Run: `git -C /home/alexis/Apps/vlv-companion tag -d v1.0.0`
Expected: `Deleted tag 'v1.0.0' (was <sha>)`

- [ ] **Step 3: Re-create the tag at the new HEAD (the version bump commit)**

Run: `git -C /home/alexis/Apps/vlv-companion tag -a v1.0.0 -m "Release v1.0.0"`

- [ ] **Step 4: Verify the new tag**

Run: `git -C /home/alexis/Apps/vlv-companion show v1.0.0:app.config.ts | grep version:`
Expected: `version: "1.0.0",`

---

### Task 3: Push master + the new tag to GitHub

**Pre-flight:** if `git ls-remote origin` fails with "Permission denied (publickey)", unlock the SSH agent first (`ssh-add`) or set `GIT_SSH_COMMAND='ssh -i ~/.ssh/<key>'`. Don't try to work around it with HTTPS unless the user explicitly asks — they're using SSH on origin.

- [ ] **Step 1: Push master**

Run: `git -C /home/alexis/Apps/vlv-companion push origin master`
Expected: succeeds. If a force-push is needed (because the remote already has a divergent v1.0.0 tag history), STOP and surface to the user — do not force-push without explicit approval.

- [ ] **Step 2: Push the v1.0.0 tag, replacing the remote one if it exists**

If the remote already has a v1.0.0 tag pointing at the old commit, it must be replaced. Check first:

Run: `git -C /home/alexis/Apps/vlv-companion ls-remote --tags origin v1.0.0`

If the remote v1.0.0 exists and points at a different SHA than the new local tag:
1. Surface to the user: "v1.0.0 already exists on the remote at <sha>. I need to overwrite it to point at the new bumped commit. OK?"
2. On approval: `git -C /home/alexis/Apps/vlv-companion push --force-with-lease origin refs/tags/v1.0.0`

If the remote v1.0.0 does not exist, plain push works:

Run: `git -C /home/alexis/Apps/vlv-companion push origin v1.0.0`

- [ ] **Step 3: Verify the remote tag**

Run: `git -C /home/alexis/Apps/vlv-companion ls-remote --tags origin v1.0.0`
Expected: a single line showing the new tag's SHA.

- [ ] **Step 4: Verify the tag triggered the GitHub release CI**

Run: `gh -R rachyandco/vlv-companion run list --workflow=release.yml --limit 3`
Expected: a run for tag `v1.0.0` either in progress or completed. (If the workflow failed because of missing keystore secrets, that's expected for a first-time setup but not blocking for F-Droid — F-Droid builds its own APK independently.)

---

### Task 4: Decide AuthorName and AuthorEmail for the F-Droid metadata

**Why:** Required fields in the metadata YAML. F-Droid reviewers will route comments to `AuthorEmail`. Cannot be a personal address you wouldn't want public on f-droid.org.

- [ ] **Step 1: Ask the user**

Use AskUserQuestion to collect:
1. `AuthorName` — the public name to credit (current spec assumed "Rachy & Co", confirm or change).
2. `AuthorEmail` — a public reviewer-contact address. Suggest a project-specific alias (e.g. `vlv-companion@<domain>`) rather than a personal email.

- [ ] **Step 2: Record the answers in a scratch file**

Write the chosen values to `/tmp/fdroid-author.txt` so subsequent tasks can read them without re-prompting. Format:
```
AuthorName=...
AuthorEmail=...
```

---

### Task 5: License audit of npm and Gradle dependencies

**Why:** §8.6 of the spec requires verifying no non-FOSS dependencies. Captured output goes into the MR description.

- [ ] **Step 1: Run a license summary across npm deps**

```bash
cd /home/alexis/Apps/vlv-companion
npx --yes license-checker --production --summary 2>/dev/null | tee /tmp/fdroid-license-summary.txt
```
Expected: a count by license type (MIT, Apache-2.0, BSD-3-Clause, ISC, etc.).

- [ ] **Step 2: Flag anything non-FOSS**

Run:
```bash
npx --yes license-checker --production --excludePackages 'vlv-companion@0.1.0' 2>/dev/null | grep -E 'license: (UNKNOWN|Custom|UNLICENSED)' || echo "No flagged licenses"
```
Expected: `No flagged licenses`. If anything appears, STOP and surface to the user — that package will block F-Droid submission and needs to be removed/replaced.

- [ ] **Step 3: Capture the Gradle side**

The native deps come from React Native core + MapLibre. These are well-known FOSS. A spot-check is sufficient — full Gradle license scanning requires a plugin we don't want to add for a one-off audit. Note in `/tmp/fdroid-license-summary.txt`:
```
Native deps: React Native 0.79.6 (MIT), Hermes (MIT), MapLibre Native (BSD-2-Clause). All FOSS.
```

---

### Task 6: Identify each screenshot in ~/Downloads/vlv-img/ and decide ordering

**Why:** Screenshots in the F-Droid metadata bundle are displayed in alphabetical order. We need ordered, descriptive filenames.

**Files:** Read-only inspection of `~/Downloads/vlv-img/*.png`.

- [ ] **Step 1: Read each PNG and identify which screen it shows**

For each file in `~/Downloads/vlv-img/*.png`, use the Read tool (which can display images) and note which app screen it shows. The known screens are: Garage list, Overview tab, Energy tab, Location tab, Commands tab, Settings.

- [ ] **Step 2: Decide the order**

Recommended order (matches the user's likely first-impression flow): Garage → Overview → Energy → Location → Commands. If a Settings screenshot is included instead of one of those, put it last. Pick the order that best showcases the app's purpose in the first one or two thumbnails (those are what users see in F-Droid lists).

- [ ] **Step 3: Build a rename mapping**

Produce a 4-line mapping (source filename → target filename), e.g.:
```
signal-2026-05-22-170517.png       → 04-commands.png
signal-2026-05-22-170517_002.png   → 01-overview.png
signal-2026-05-22-170517_003.png   → 02-energy.png
signal-2026-05-22-170517_004.png   → 03-location.png
```
Save to `/tmp/fdroid-screenshot-rename.txt` for use in Task 11.

---

### Task 7: Create the `fdroid-rename-fallback` branch

**Why:** §3 of the spec: a ready-to-merge branch that renames the display string from "Vlv Companion" to "VCompanion", in case the F-Droid reviewer objects to the current name.

**Files:**
- Modify: `app.config.ts` (only on the branch, not on master)

- [ ] **Step 1: Branch off the v1.0.0 tag**

```bash
cd /home/alexis/Apps/vlv-companion
git checkout -b fdroid-rename-fallback v1.0.0
```

- [ ] **Step 2: Change the display name in app.config.ts**

In `app.config.ts`, change the line `name: "Vlv Companion",` to `name: "VCompanion",`. Keep all other fields identical — `slug`, `android.package`, OAuth scheme, intent filters, plugins, icon, version, versionCode.

- [ ] **Step 3: Verify the change is minimal**

Run: `git -C /home/alexis/Apps/vlv-companion diff v1.0.0 --stat`
Expected: `app.config.ts | 2 +- 1 file changed, 1 insertion(+), 1 deletion(-)`. If anything else changed, revert and redo.

Run: `git -C /home/alexis/Apps/vlv-companion diff v1.0.0`
Expected: a single-line diff replacing `"Vlv Companion"` with `"VCompanion"`.

- [ ] **Step 4: Commit on the fallback branch**

```bash
git add app.config.ts
git commit -m "$(cat <<'EOF'
Rename display name to VCompanion (F-Droid fallback)

Held on this branch in case the F-Droid reviewer objects to "Vlv Companion"
as too thin an obfuscation of "Volvo". All internal identifiers
(applicationId, OAuth scheme, redirect URI) stay unchanged so the merge
is safe to fast-forward and re-tag if needed.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Push the branch**

```bash
git push -u origin fdroid-rename-fallback
```

- [ ] **Step 6: Return to master**

```bash
git checkout master
```

---

## Workstream B — Prepare the fdroiddata MR

### Task 8: Install fdroidserver tools locally

**Why:** Needed for `fdroid lint`, `fdroid rewritemeta`, and `fdroid build`. The `pipx`-installed CLI is sufficient for pre-submission verification; the full buildserver VM is not required at this stage (it's what F-Droid's own infrastructure uses).

- [ ] **Step 1: Check whether pipx is available**

Run: `which pipx`
Expected: a path, or "no pipx".

If missing:
```bash
sudo apt-get update && sudo apt-get install -y pipx
pipx ensurepath
# Open a new shell so PATH includes ~/.local/bin
```

- [ ] **Step 2: Install fdroidserver**

```bash
pipx install fdroidserver
```
Expected: `installed package fdroidserver <version>`.

- [ ] **Step 3: Verify the tool runs**

```bash
fdroid --version
```
Expected: a version string (anything ≥2.0). If it errors about missing Java/Android SDK, those are needed for `fdroid build` later — install JDK 17 and ensure `$ANDROID_HOME` points at an SDK with `platforms;android-35` and `build-tools;35.0.0` installed (matches the existing CI in `.github/workflows/release.yml`).

---

### Task 9: Fork fdroiddata and clone the fork

**Why:** F-Droid takes MRs on GitLab against `fdroid/fdroiddata`. You need write access to your own fork.

- [ ] **Step 1: Confirm the user has a GitLab account**

If unclear, ask. The username decides the fork URL. Record it (e.g. as `GITLAB_USER`).

- [ ] **Step 2: Fork via the GitLab web UI**

The user needs to manually fork at https://gitlab.com/fdroid/fdroiddata in the browser — there's no first-class CLI for forking GitLab projects without auth setup. Ask the user to confirm when the fork exists at `https://gitlab.com/<GITLAB_USER>/fdroiddata`.

- [ ] **Step 3: Clone the fork to ~/Apps/fdroiddata**

```bash
cd ~/Apps
git clone https://gitlab.com/<GITLAB_USER>/fdroiddata.git
cd fdroiddata
git remote add upstream https://gitlab.com/fdroid/fdroiddata.git
git fetch upstream
```

- [ ] **Step 4: Branch off `upstream/master`**

```bash
git checkout -b add-vlv-companion upstream/master
```

---

### Task 10: Write the metadata YAML

**Files:**
- Create: `~/Apps/fdroiddata/metadata/app.volvocompanion.yml`

- [ ] **Step 1: Read the author values from /tmp/fdroid-author.txt** (set in Task 4)

- [ ] **Step 2: Write the YAML file**

Create `~/Apps/fdroiddata/metadata/app.volvocompanion.yml` with this exact content, substituting `<AuthorName>` and `<AuthorEmail>` from the scratch file:

```yaml
Categories:
  - Connectivity
License: GPL-3.0-or-later
AuthorName: <AuthorName>
AuthorEmail: <AuthorEmail>
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

- [ ] **Step 3: Verify the YAML parses**

```bash
cd ~/Apps/fdroiddata
python3 -c "import yaml; yaml.safe_load(open('metadata/app.volvocompanion.yml'))"
```
Expected: no output (silent success).

---

### Task 11: Write the en-US text metadata files

**Files:**
- Create: `~/Apps/fdroiddata/metadata/app.volvocompanion/en-US/title.txt`
- Create: `~/Apps/fdroiddata/metadata/app.volvocompanion/en-US/short_description.txt`
- Create: `~/Apps/fdroiddata/metadata/app.volvocompanion/en-US/full_description.txt`

- [ ] **Step 1: Create the en-US directory**

```bash
mkdir -p ~/Apps/fdroiddata/metadata/app.volvocompanion/en-US/phoneScreenshots
```

- [ ] **Step 2: Write title.txt**

Content (single line, no trailing newline-padding):
```
Vlv Companion
```

- [ ] **Step 3: Write short_description.txt**

Content (≤80 chars per F-Droid recommendation):
```
A degoogled-friendly client for the Volvo Cars developer APIs.
```

Verify length:
```bash
wc -c ~/Apps/fdroiddata/metadata/app.volvocompanion/en-US/short_description.txt
```
Expected: ≤ 81 (80 chars + newline).

- [ ] **Step 4: Write full_description.txt**

Content (the trademark-fair-use paragraph MUST be first):

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

* OAuth 2.0 + PKCE sign-in against Volvo ID (EU region).
* Garage list with per-vehicle name and EV toggle.
* Per-vehicle screens: Overview (locking, battery, range, odometer, fuel,
  service distance, per-corner tyre pressure), Energy (battery gauge,
  charging status, target SoC, time-to-target), Location (MapLibre +
  OpenFreeMap tiles, handoff to OsmAnd / Organic Maps / Magic Earth via
  geo: URIs), and Commands (lock, unlock, honk, flash, climatisation
  start/stop, engine start/stop).

You must register your own application on developer.volvocars.com and host
a small static HTTPS redirect bridge (provided in the source tree); the
app guides you through this on first launch.
```

---

### Task 12: Copy & rename screenshots into the metadata bundle

**Why:** F-Droid expects screenshots at `metadata/<appid>/en-US/phoneScreenshots/`, alphabetically ordered.

- [ ] **Step 1: Read the rename mapping from /tmp/fdroid-screenshot-rename.txt** (built in Task 6)

- [ ] **Step 2: Copy each PNG with the new name**

For each `source → target` line in the mapping:
```bash
cp ~/Downloads/vlv-img/<source> ~/Apps/fdroiddata/metadata/app.volvocompanion/en-US/phoneScreenshots/<target>
```

- [ ] **Step 3: Verify the directory contents**

```bash
ls ~/Apps/fdroiddata/metadata/app.volvocompanion/en-US/phoneScreenshots/
```
Expected: four PNG files, alphabetically ordered as decided in Task 6 (e.g. `01-overview.png  02-energy.png  03-location.png  04-commands.png`).

- [ ] **Step 4: Spot-check dimensions and format**

```bash
for f in ~/Apps/fdroiddata/metadata/app.volvocompanion/en-US/phoneScreenshots/*.png; do
  python3 -c "from PIL import Image; im=Image.open('$f'); print('$f', im.size, im.mode)"
done
```
Expected: all four lines should show portrait dimensions in the 320–3840 range (e.g. `(720, 1560) RGB`).

---

### Task 13: Lint and normalise the metadata

**Why:** `fdroid lint` is what the reviewer runs first; passing it locally removes the most common cause of MR rejections.

- [ ] **Step 1: Run rewritemeta to normalise the YAML formatting**

```bash
cd ~/Apps/fdroiddata
fdroid rewritemeta app.volvocompanion
```
Expected: writes back the YAML file. If it fails with a parse error, fix the YAML and rerun.

- [ ] **Step 2: Check what changed**

```bash
git diff metadata/app.volvocompanion.yml
```
Expected: cosmetic reordering of keys at most. Any substantive change is a signal something was malformed; review and accept the normalisation.

- [ ] **Step 3: Run the linter**

```bash
fdroid lint app.volvocompanion
```
Expected: exits 0 with no output, or only informational warnings. ANY error must be fixed before proceeding — common ones:
- "Categories: must be a known category" — pick from the canonical list in `~/.local/share/pipx/venvs/fdroidserver/lib/python*/site-packages/fdroidserver/_data/share/categories.txt` (or `fdroid lint --help` to see what's recognised).
- "License: not a recognised SPDX identifier" — GPL-3.0-or-later is correct; if it complains, double-check spelling.
- "URLs must be HTTPS" — all four URLs in the recipe are already HTTPS; only triggers if you typo one.

---

### Task 14: Run `fdroid build` locally

**Why:** §8.4 of the spec. This is the single most important verification before opening the MR — if the F-Droid build fails on the reviewer's machine, they close the MR with "doesn't build."

**Pre-requisite:** JDK 17 and an Android SDK with `platforms;android-35`, `build-tools;35.0.0`, `ndk;27.1.12297006` (matches the existing CI). If any are missing, install them — `sdkmanager --install "..."`.

- [ ] **Step 1: Confirm the JDK and SDK are in place**

```bash
java -version 2>&1 | head -1
echo "ANDROID_HOME=$ANDROID_HOME"
ls "$ANDROID_HOME/platforms" 2>/dev/null | grep android-35 || echo "platforms;android-35 MISSING"
ls "$ANDROID_HOME/build-tools" 2>/dev/null | grep ^35 || echo "build-tools;35.0.0 MISSING"
ls "$ANDROID_HOME/ndk" 2>/dev/null | grep 27.1 || echo "ndk;27.1.12297006 MISSING"
```
Expected: no MISSING lines. If anything's missing, install before continuing.

- [ ] **Step 2: Run the build**

```bash
cd ~/Apps/fdroiddata
fdroid build --verbose app.volvocompanion:1.0.0 2>&1 | tee /tmp/fdroid-build.log
```
Expected outcomes:

- **Success** — log ends with something like `Build succeeded` and an APK appears at `~/Apps/fdroiddata/unsigned/app.volvocompanion_1.apk`.
- **Failure on missing `pnpm`** — the `sudo:` block in the recipe didn't take effect (some local fdroidserver setups bypass sudo). Fix: install pnpm in your user env (`npm install -g pnpm@9`) and re-run.
- **Failure on `--ignore-scripts`** — a postinstall step is genuinely needed. Capture which package and which script, then add a targeted `init:` step. STOP and surface to the user with the captured error.
- **Failure during gradle** — read the gradle output carefully. Typically: missing SDK component (fix above), out of memory (set `GRADLE_OPTS=-Xmx4g`), or React Native autolinking complaint (means a dependency is misconfigured — STOP and surface).

- [ ] **Step 3: Confirm the APK exists**

```bash
ls -la ~/Apps/fdroiddata/unsigned/app.volvocompanion_1.apk
```
Expected: a file >5 MB.

---

### Task 15: Sanity-check the built APK with aapt

**Why:** §8.5 of the spec. Verifies the APK matches what the metadata claims and contains no unintended permissions.

- [ ] **Step 1: Run aapt badging**

```bash
"$ANDROID_HOME/build-tools/35.0.0/aapt" dump badging ~/Apps/fdroiddata/unsigned/app.volvocompanion_1.apk | tee /tmp/fdroid-badging.txt
```

- [ ] **Step 2: Verify package, versionCode, versionName**

```bash
grep '^package:' /tmp/fdroid-badging.txt
```
Expected EXACTLY:
```
package: name='app.volvocompanion' versionCode='1' versionName='1.0.0' platformBuildVersionName='15' compileSdkVersion='35' compileSdkVersionCodename='15'
```
(The `platformBuildVersionName` / `compileSdkVersion` numbers may differ slightly with toolchain updates. The `name` / `versionCode` / `versionName` triple must match.)

- [ ] **Step 3: Verify the permission set**

```bash
grep '^uses-permission:' /tmp/fdroid-badging.txt
```
Expected exactly ONE line:
```
uses-permission: name='android.permission.INTERNET'
```
If anything else appears (`ACCESS_FINE_LOCATION`, `READ_EXTERNAL_STORAGE`, `BIND_GET_INSTALL_REFERRER_SERVICE`, etc.), STOP — the `blockedPermissions` array in `app.config.ts` is supposed to scrub these. Surface the violating permission to the user; it indicates a regression in the prebuild.

- [ ] **Step 4: Confirm the OAuth intent filter is the only deep-link entry**

```bash
"$ANDROID_HOME/build-tools/35.0.0/aapt" dump xmltree ~/Apps/fdroiddata/unsigned/app.volvocompanion_1.apk AndroidManifest.xml | grep -A2 'android:scheme' | head -30
```
Expected: a single `android:scheme="volvo-companion"` entry (the OAuth callback) and a `android:scheme="geo"` query block (the maps handoff). No broad `volvo-companion://` catch-all should appear.

---

### Task 16: Commit the metadata to the fdroiddata branch and push

- [ ] **Step 1: Stage the new files**

```bash
cd ~/Apps/fdroiddata
git add metadata/app.volvocompanion.yml metadata/app.volvocompanion/
git status
```
Expected: 6 new files staged — the YAML, three text files, and four PNGs.

- [ ] **Step 2: Commit**

```bash
git commit -m "$(cat <<'EOF'
New app: Vlv Companion (app.volvocompanion)

A React Native Android client for the Volvo Cars public developer APIs
(Connected Vehicle v2, Energy v2, Location v1). Targets degoogled phones
(GrapheneOS, /e/OS, CalyxOS, LineageOS-without-GApps). No Firebase, no
Google Play services, no Google Maps.

GPL-3.0-or-later. Independent project; uses the descriptive abbreviation
"Vlv" to refer to the Volvo developer API without invoking the trademark.
See TRADEMARKS.md in the source tree.

NonFreeNet: depends on the Volvo developer API (proprietary online
service, no FOSS substitute).
EOF
)"
```

- [ ] **Step 3: Push the branch to the user's fork**

```bash
git push -u origin add-vlv-companion
```

---

### Task 17: Open the Merge Request

- [ ] **Step 1: Write the MR description to /tmp/fdroid-mr-description.md**

Write the following to `/tmp/fdroid-mr-description.md`, substituting the bracketed bits with the actual values gathered in earlier tasks (license summary from Task 5, distro from `lsb_release -d` or `uname -a`):

```markdown
## New app: Vlv Companion (`app.volvocompanion`), GPL-3.0-or-later

### Trademark posture

"Vlv Companion" is a descriptive abbreviation used to factually reference
the Volvo Cars developer API this app interoperates with. The project is
independent and not affiliated with Volvo Car Corporation or any of its
subsidiaries. Full notice in the source tree:
https://github.com/rachyandco/vlv-companion/blob/v1.0.0/TRADEMARKS.md

If the reviewer prefers a more obviously brand-neutral name, the `fdroid-
rename-fallback` branch on the vlv-companion repo is one commit ahead of
v1.0.0 and renames the display string to "VCompanion" without touching
the applicationId or OAuth flow. I can fast-forward and cut a v1.0.1 on
request.

### NonFreeNet justification

The Volvo Connected Vehicle, Energy, and Location developer APIs
(developer.volvocars.com) are a proprietary, single-source online service
with terms-of-service restrictions and no FOSS substitute. The app is
non-functional without them. Marking `NonFreeNet` accordingly.

No other anti-features apply: tiles come from OpenFreeMap (open data),
the map renderer is MapLibre Native (BSD-2-Clause), and there is no
analytics, telemetry, or crash-reporting SDK in the dependency graph.

### Pre-submission verification

- `fdroid lint app.volvocompanion` — clean
- `fdroid build app.volvocompanion:1.0.0` — succeeded locally on
  `<distro from uname -a>`
- `aapt dump badging` — confirmed `INTERNET`-only permission set,
  `package: name='app.volvocompanion' versionCode='1' versionName='1.0.0'`
- npm license audit (production deps only):

  ```
  <paste of /tmp/fdroid-license-summary.txt>
  ```

  Native deps: React Native 0.79.6 (MIT), Hermes (MIT), MapLibre Native
  (BSD-2-Clause). All FOSS.

### Build-recipe note

The recipe installs `pnpm@9` in the `sudo:` block because the project's
lockfile is `pnpm-lock.yaml`. If you prefer to keep the build server's
package-manager surface to npm only, I can commit a generated
`package-lock.json` and switch the recipe to `npm ci --ignore-scripts`.
Let me know which you prefer.
```

- [ ] **Step 2: Open the MR**

Either via the GitLab web UI (visit the fork's branch and click "Create merge request") or via the `glab` CLI if installed:

```bash
glab mr create \
  --source-branch add-vlv-companion \
  --target-branch master \
  --target-repo fdroid/fdroiddata \
  --title "New app: Vlv Companion (app.volvocompanion)" \
  --description "$(cat /tmp/fdroid-mr-description.md)"
```

If `glab` is not installed, ask the user to open the MR manually and paste the description.

- [ ] **Step 3: Capture the MR URL**

Once opened, record the MR URL. Mention it to the user so they can watch for reviewer comments.

---

## Acceptance Verification

The work is done when all four of these are true:

1. `git -C ~/Apps/vlv-companion ls-remote --tags origin v1.0.0` returns the new tag's SHA, and `git show v1.0.0:app.config.ts | grep version:` says `"1.0.0"`.
2. `~/Apps/fdroiddata/unsigned/app.volvocompanion_1.apk` exists and passes the §15 aapt checks.
3. The MR is open on `gitlab.com/fdroid/fdroiddata` with the description from Task 17.
4. The `fdroid-rename-fallback` branch exists on `github.com/rachyandco/vlv-companion`, diffs by exactly one line vs `v1.0.0` (the `name:` field in `app.config.ts`).

---

## What this plan deliberately does not do

- **Reproducible-builds verification.** Deferred per §10 of the spec.
- **Self-hosted F-Droid repo.** Deferred per §10 of the spec.
- **CI guard for `android/` drift.** Deferred per §10 of the spec.
- **Re-capturing screenshots without "Volvo Black" visible.** Only if the reviewer asks (§9 of the spec).
- **Feature graphic.** Optional; not blocking for the initial submission.

If the reviewer asks for any of those, treat it as a follow-up task and amend the MR.
