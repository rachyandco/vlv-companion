# Phone Endpoint Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Android app fetch and display the seven Connected Vehicle read endpoints it does not use today (windows, warnings, statistics, engine, engine-status, brakes, commands list).

**Architecture:** Thin `ky` wrappers in `src/api/vehicles.ts`, one TanStack Query hook per endpoint in `src/hooks/useVehicle.ts` under the existing `["vehicle", vin]` key prefix, and new sections on the Overview and Commands screens built from the existing `StatusTile`, `CarTopView` and `CommandButton` components. Pure helpers (warning text, command-name mapping) live in small modules with vitest coverage.

**Tech Stack:** Expo SDK 53, React Native, TypeScript, TanStack Query, ky, react-native-svg, vitest.

**Spec:** `docs/superpowers/specs/2026-11-06-linux-desktop-and-endpoint-parity-design.md` §3–§4.

## Global Constraints

- No new dependencies; ESLint forbids Google/Firebase/location packages.
- Every new query key starts with `vehicleKeys.all(vin)` so `useInvokeCommand`'s invalidation covers it.
- Colours: closed/OK green `rgba(52,211,153,0.55)`, open/warn red `rgba(239,68,68,0.85)` on the car view; tile text amber `#fbe2b3` for warnings, green `#86efac` for OK.
- Unsupported or missing fields render "—" via `renderResource`, never crash.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` must pass before each commit.

## Review Focus

1. A car that returns HTTP 404 or an empty `data` for `/commands` must leave every button enabled (Task 2 test: `commandNameFromApi` never throws; Task 6 code: disabled only when the list is non-empty).
2. A `/warnings` payload where every field is `NO_WARNING` must render the Health section with a single "No warnings" tile, not 23 OK tiles (Task 5 test on `activeWarnings`).
3. An unknown warning string such as `"UNSPECIFIED"` must show as unknown "—", not as a red warning (Task 4 test).
4. `/windows` absent (older cars) must leave the car view unchanged (Task 3: overlays use `fill(undefined)` = transparent).
5. `/engine-status` value other than `RUNNING`/`STOPPED` must not show "Engine running" (Task 5 test on `engineLabel`).

---

### Task 1: Types, API functions and hooks for the seven reads

**Files:**
- Modify: `src/api/types.ts` (after `DiagnosticsResponse`)
- Modify: `src/api/vehicles.ts`
- Modify: `src/hooks/useVehicle.ts`

**Interfaces:**
- Produces, in `src/api/types.ts`:
  - `Windows = { frontLeftWindow?, frontRightWindow?, rearLeftWindow?, rearRightWindow?, sunroof?: ResourceInstanceString }`, `WindowsResponse = { data: Windows }`
  - `ExteriorWarnings = Record<string, ResourceInstanceString | undefined>` with the 23 keys from the generated `ExteriorWarning` schema listed as optional properties, `WarningsResponse = { data: ExteriorWarnings }`
  - `Statistics = { averageSpeed?, distanceToEmpty?, tripMeter1?, tripMeter2?, averageFuelConsumption?: ResourceInstanceWithUnit<number> }`, `StatisticsResponse = { data: Statistics }`
  - `EngineDiagnostics = { oilLevelWarning?, engineCoolantLevelWarning?: ResourceInstanceString }`, `EngineDiagnosticsResponse`
  - `EngineStatus = { engineStatus?: ResourceInstanceString }`, `EngineStatusResponse`
  - `Brakes = { brakeFluidLevelWarning?: ResourceInstanceString }`, `BrakesResponse`
  - `ApiCommandName = "HONK_AND_FLASH" | "HONK" | "FLASH" | "LOCK" | "LOCK_REDUCED_GUARD" | "UNLOCK" | "ENGINE_START" | "ENGINE_STOP" | "CLIMATIZATION_START" | "CLIMATIZATION_STOP" | "SEND_NAVI_POI"`, `CommandListItem = { command?: ApiCommandName; href?: string }`, `CommandListResponse = { data?: CommandListItem[] }`
- Produces, in `src/api/vehicles.ts`: `getWindows`, `getWarnings`, `getStatistics`, `getEngineDiagnostics` (path `/engine`), `getEngineStatus` (path `/engine-status`), `getBrakes`, `listCommands` (path `/commands`), each `(api: KyInstance, vin: string) => Promise<XResponse>` in the style of `getDoors`.
- Produces, in `src/hooks/useVehicle.ts`: `vehicleKeys.windows|warnings|statistics|engine|engineStatus|brakes|commands`, and hooks `useWindows`, `useWarnings`, `useStatistics`, `useEngineDiagnostics`, `useEngineStatus`, `useBrakes`, `useCommandList`, each `(vin: string) => UseQueryResult<XResponse>`. Stale times: windows and engineStatus `HALF_MIN`; warnings, statistics, engine, brakes `5 * ONE_MIN`; commands `24 * ONE_HOUR`.

- [ ] **Step 1: Add the types** to `src/api/types.ts` exactly as listed above.
- [ ] **Step 2: Add the seven functions** to `src/api/vehicles.ts`.
- [ ] **Step 3: Add the keys and hooks** to `src/hooks/useVehicle.ts`.
- [ ] **Step 4: Verify**

Run: `pnpm typecheck && pnpm lint`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/api/types.ts src/api/vehicles.ts src/hooks/useVehicle.ts
git commit -m "feat(api): add windows, warnings, statistics, engine, brakes and command-list reads"
```

---

### Task 2: Command-name mapping

**Files:**
- Modify: `src/api/commands.ts`
- Test: `src/api/commands.test.ts` (create)

**Interfaces:**
- Produces: `commandNameFromApi(name: string): CommandName | null` and `supportedCommands(list: CommandListItem[] | undefined): Set<CommandName>`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import { commandNameFromApi, supportedCommands } from "./commands";

describe("commandNameFromApi", () => {
  it("maps every documented API name to its POST path", () => {
    expect(commandNameFromApi("HONK_AND_FLASH")).toBe("honk-flash");
    expect(commandNameFromApi("LOCK_REDUCED_GUARD")).toBe("lock-reduced-guard");
    expect(commandNameFromApi("CLIMATIZATION_START")).toBe("climatization-start");
    expect(commandNameFromApi("ENGINE_STOP")).toBe("engine-stop");
  });
  it("returns null for names the app cannot send", () => {
    expect(commandNameFromApi("SEND_NAVI_POI")).toBeNull();
    expect(commandNameFromApi("")).toBeNull();
    expect(commandNameFromApi("lock")).toBeNull();
  });
});

describe("supportedCommands", () => {
  it("is empty for an undefined or empty list", () => {
    expect(supportedCommands(undefined).size).toBe(0);
    expect(supportedCommands([]).size).toBe(0);
  });
  it("collects mappable names and skips the rest", () => {
    const set = supportedCommands([{ command: "LOCK" }, { command: "SEND_NAVI_POI" }, {}]);
    expect([...set]).toEqual(["lock"]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run src/api/commands.test.ts`
Expected: FAIL, `commandNameFromApi` is not exported.

- [ ] **Step 3: Implement** both functions in `src/api/commands.ts` with a `const API_TO_PATH: Record<string, CommandName>` table covering the ten sendable names.
- [ ] **Step 4: Run to verify pass**

Run: `pnpm vitest run src/api/commands.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/api/commands.ts src/api/commands.test.ts
git commit -m "feat(commands): map Volvo command-list names to POST paths"
```

---

### Task 3: Window overlays on the car top view

**Files:**
- Modify: `src/components/CarTopView.tsx`

**Interfaces:**
- Consumes: `Windows` from Task 1.
- Produces: `CarTopView` accepts a new optional prop `windows?: Windows`.

- [ ] **Step 1: Add the prop and five `<Rect>` overlays** inside the existing `<Svg viewBox="0 0 588 1030">`, drawn after the door rects, using the same `fill(isOpen(...))` helper. Coordinates (image space): front-left window `x=40 y=370 w=80 h=100 rx=12`; front-right `x=468 y=370 w=80 h=100`; rear-left `x=40 y=525 w=80 h=110`; rear-right `x=468 y=525 w=80 h=110`; sunroof `x=190 y=330 w=208 h=120 rx=20`. The sunroof rect is only rendered when `windows?.sunroof` is defined.
- [ ] **Step 2: Verify**

Run: `pnpm typecheck && pnpm lint`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/CarTopView.tsx
git commit -m "feat(overview): draw window and sunroof state on the car top view"
```

---

### Task 4: Warning text helper

**Files:**
- Create: `src/lib/warnings.ts`
- Test: `src/lib/warnings.test.ts`

**Interfaces:**
- Produces: `type WarningLevel = "ok" | "warn" | "unknown"`; `describeWarning(field: ResourceInstanceString | undefined): { text: string; level: WarningLevel }`; `activeWarnings(warnings: ExteriorWarnings | undefined): { key: string; label: string; text: string }[]`; `humanizeKey(key: string): string` (camelCase → "Brake light center", strips trailing "Warning").

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import { activeWarnings, describeWarning, humanizeKey } from "./warnings";

const f = (value: string) => ({ value, updatedAt: "2026-11-06T00:00:00Z" });

describe("describeWarning", () => {
  it("treats NO_WARNING, NONE and OK as ok", () => {
    for (const v of ["NO_WARNING", "NONE", "OK", "no_warning"]) {
      expect(describeWarning(f(v))).toEqual({ text: "OK", level: "ok" });
    }
  });
  it("treats UNSPECIFIED and missing as unknown", () => {
    expect(describeWarning(f("UNSPECIFIED"))).toEqual({ text: "—", level: "unknown" });
    expect(describeWarning(undefined)).toEqual({ text: "—", level: "unknown" });
  });
  it("humanises anything else as a warning", () => {
    expect(describeWarning(f("TOO_LOW"))).toEqual({ text: "Too low", level: "warn" });
    expect(describeWarning(f("FAILURE"))).toEqual({ text: "Failure", level: "warn" });
  });
});

describe("humanizeKey", () => {
  it("splits camelCase and drops the Warning suffix", () => {
    expect(humanizeKey("brakeLightCenterWarning")).toBe("Brake light center");
    expect(humanizeKey("oilLevelWarning")).toBe("Oil level");
  });
});

describe("activeWarnings", () => {
  it("returns only non-ok, known entries", () => {
    const out = activeWarnings({
      brakeLightCenterWarning: f("NO_WARNING"),
      lowBeamLeftWarning: f("FAILURE"),
      fogLightRearWarning: f("UNSPECIFIED"),
    });
    expect(out).toEqual([{ key: "lowBeamLeftWarning", label: "Low beam left", text: "Failure" }]);
  });
  it("is empty for undefined input", () => {
    expect(activeWarnings(undefined)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run src/lib/warnings.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement** `src/lib/warnings.ts`. Humanising a value: lower-case, replace `_` with space, capitalise the first letter.
- [ ] **Step 4: Run to verify pass**

Run: `pnpm vitest run src/lib/warnings.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/warnings.ts src/lib/warnings.test.ts
git commit -m "feat: warning text helper for engine, brake and exterior warnings"
```

---

### Task 5: Overview screen: engine state, Health and Trip sections

**Files:**
- Create: `src/lib/engine.ts`, `src/lib/engine.test.ts`
- Modify: `app/(tabs)/vehicle/[vin]/index.tsx`

**Interfaces:**
- Consumes: hooks from Task 1, `CarTopView.windows` from Task 3, helpers from Task 4, `StatusTile`, `renderResource`.
- Produces: `engineLabel(field: ResourceInstanceString | undefined): string | null` in `src/lib/engine.ts` — `"RUNNING"` → `"Engine running"`, `"STOPPED"` → `"Engine off"`, anything else or undefined → `null`.

- [ ] **Step 1: Write the failing test** `src/lib/engine.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { engineLabel } from "./engine";
const f = (value: string) => ({ value, updatedAt: "2026-11-06T00:00:00Z" });
describe("engineLabel", () => {
  it("maps RUNNING and STOPPED", () => {
    expect(engineLabel(f("RUNNING"))).toBe("Engine running");
    expect(engineLabel(f("stopped"))).toBe("Engine off");
  });
  it("returns null for unknown values", () => {
    expect(engineLabel(f("UNSPECIFIED"))).toBeNull();
    expect(engineLabel(undefined)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure** — `pnpm vitest run src/lib/engine.test.ts` → FAIL, module not found.
- [ ] **Step 3: Implement** `src/lib/engine.ts`.
- [ ] **Step 4: Run to verify pass** — same command → PASS (2 tests).
- [ ] **Step 5: Wire the Overview screen.** In `index.tsx`: call `useWindows`, `useEngineStatus`, `useEngineDiagnostics`, `useBrakes`, `useWarnings`, `useStatistics`; include them in `refreshing` and `refetchAll`; pass `windows={windows.data?.data}` to `CarTopView`; append `engineLabel(...)` to `headerSub` after the availability text, separated by `  ·  `; add after `<TyreStatus>`:
  - a section titled `HEALTH` (same title style as `TyreStatus`) with `StatusTile`s: `Oil level`, `Coolant level`, `Brake fluid`, each `value = describeWarning(field).text` and `hint` omitted; then one tile per `activeWarnings(warnings.data?.data)` entry (`label` = entry label, `value` = entry text), or a single tile `Lights` / `No warnings` when the list is empty and the warnings query succeeded.
  - a section titled `TRIP` with tiles `Trip meter 1`, `Trip meter 2`, `Average speed`, `Fuel consumption`, `Distance to empty`, each `value = renderResource(field)`. The Trip section is omitted entirely when `statistics.data?.data` is undefined.
- [ ] **Step 6: Verify** — `pnpm typecheck && pnpm lint && pnpm test` → all exit 0.
- [ ] **Step 7: Commit**

```bash
git add src/lib/engine.ts src/lib/engine.test.ts "app/(tabs)/vehicle/[vin]/index.tsx"
git commit -m "feat(overview): engine state, health and trip sections from the new reads"
```

---

### Task 6: Commands screen honours the car's command list

**Files:**
- Modify: `app/(tabs)/vehicle/[vin]/commands.tsx`

**Interfaces:**
- Consumes: `useCommandList` (Task 1), `supportedCommands` (Task 2).

- [ ] **Step 1: Gate the buttons.** Compute `const supported = supportedCommands(commandList.data?.data)`. For each `CommandButton` with command `c`: `disabled={!isAvailable || (supported.size > 0 && !supported.has(c))}` and, when the second condition holds, label becomes `` `${label} — not supported by this car` ``. Replace the comment block that currently explains why gating is skipped.
- [ ] **Step 2: Verify** — `pnpm typecheck && pnpm lint` → exit 0.
- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/vehicle/[vin]/commands.tsx"
git commit -m "feat(commands): disable commands the car does not list"
```

---

### Task 7: README and on-device verification

**Files:**
- Modify: `README.md:127-133` ("API surface (covered today)")

- [ ] **Step 1: Update the list** so the connected-vehicle line reads `{doors,windows,fuel,odometer,tyres,engine,engine-status,brakes,diagnostics,warnings,statistics,commands,command-accessibility}` and add a sentence under the list: "Every read endpoint of the three APIs is covered; the deprecated Energy v1 `recharge-status` is intentionally skipped."
- [ ] **Step 2: Build and install on the Volla phone**

Run: `cd android && ./gradlew assembleRelease --console=plain && adb install -r app/build/outputs/apk/release/app-release.apk`
Expected: `BUILD SUCCESSFUL`, `Success`.

- [ ] **Step 3: Verify on screen.** Launch, open the XC40 Overview, `adb exec-out screencap -p > /tmp/claude-1000/-home-alexis-Apps-vlv-companion/bd6ef726-fc8c-4565-a48f-8fa6305d45fd/scratchpad/overview.png`, scroll and capture again; the Health and Trip sections must show values or "—", the header must show "Engine off", and no red error banner appears. Open Commands: every button enabled for the XC40 (it lists all commands) except Engine (EV).
- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: API surface now covers every read endpoint"
```
