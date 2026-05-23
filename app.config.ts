import type { ExpoConfig } from "expo/config";
import { withAndroidManifest, type ConfigPlugin } from "expo/config-plugins";

const SCHEME = "volvo-companion";

// `expo prebuild` re-emits the AndroidManifest from its templates each run.
// Force allowBackup=false via a config plugin so this isn't undone next prebuild.
// (The fullBackupContent / dataExtractionRules attributes are dropped by passing
// `configureAndroidBackup: false` to the expo-secure-store plugin below.)
const withAllowBackupOff: ConfigPlugin = (config) =>
  withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    // Fail loud on prebuild if Expo's manifest shape changes — silently
    // skipping would re-enable allowBackup without any signal.
    if (!app) {
      throw new Error("withAllowBackupOff: AndroidManifest has no <application> element.");
    }
    app.$["android:allowBackup"] = "false";
    return cfg;
  });

// Android 11+ requires <queries> entries for any URI scheme passed to
// Linking.canOpenURL / openURL outside the calling app. Without this, the
// "Open in maps" button silently falls through (canOpenURL returns false)
// even though OsmAnd / Organic Maps are installed.
const withGeoQuery: ConfigPlugin = (config) =>
  withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    type QueriesBlock = { intent?: { data?: { $: { "android:scheme": string } }[] }[] };
    const queriesList = (manifest.queries ?? []) as QueriesBlock[];
    const hasGeo = queriesList.some((q) =>
      q.intent?.some((i) => i.data?.some((d) => d.$["android:scheme"] === "geo")),
    );
    if (hasGeo) return cfg;
    // Append a fresh <queries> block rather than mutating an existing one —
    // future Expo releases may restructure the queries layout, but appending
    // a self-contained block stays correct as long as <queries> is allowed
    // to repeat (the manifest merger combines them).
    manifest.queries = [
      ...queriesList,
      {
        intent: [
          {
            action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
            category: [{ $: { "android:name": "android.intent.category.BROWSABLE" } }],
            data: [{ $: { "android:scheme": "geo" } }],
          },
        ],
      },
    ];
    return cfg;
  });

// expo-modules-core emits expo.modules.updates.* meta-data unconditionally,
// even when ENABLED=false. The CHECK_ON_LAUNCH=ALWAYS / LAUNCH_WAIT_MS=0
// pair contradicts ENABLED=false; strip the irrelevant entries so the
// merged manifest is internally consistent.
const withoutUpdatesNoise: ConfigPlugin = (config) =>
  withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) {
      throw new Error("withoutUpdatesNoise: AndroidManifest has no <application> element.");
    }
    const drop = new Set([
      "expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH",
      "expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS",
    ]);
    app["meta-data"] = (app["meta-data"] ?? []).filter((m) => !drop.has(m.$["android:name"]));
    return cfg;
  });

const config = {
  name: "Vlv Companion",
  slug: "vlv-companion",
  version: "1.0.0",
  orientation: "portrait",
  // Intentionally NOT setting `scheme:` at the top level — Expo's config
  // plugin would auto-emit a broad `<data android:scheme="volvo-companion"/>`
  // intent filter that catches every URI under the scheme. We only want the
  // narrow OAuth-callback filter declared in `android.intentFilters` below.
  // (The deep-link scheme stays `volvo-companion://` because that's what's
  // registered with the Volvo developer portal as the OAuth redirect target;
  // it is an internal identifier, not a user-facing brand.)
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  icon: "./assets/icon.png",
  android: {
    package: "app.volvocompanion",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0b1726",
    },
    permissions: ["android.permission.INTERNET"],
    blockedPermissions: [
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.VIBRATE",
      // com.android.installreferrer (transitive) injects this Play-services
      // permission; strip it to keep the app degoogled.
      "com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE",
    ],
    edgeToEdgeEnabled: true,
    intentFilters: [
      {
        action: "VIEW",
        category: ["DEFAULT", "BROWSABLE"],
        data: [{ scheme: SCHEME, host: "oauth", pathPrefix: "/callback" }],
      },
    ],
  },
  plugins: [
    "expo-router",
    [
      "expo-secure-store",
      {
        // We set allowBackup=false outright (see withAllowBackupOff below), so
        // the per-key backup-exclusion XML files are unnecessary noise.
        configureAndroidBackup: false,
      },
    ],
    "expo-web-browser",
    [
      "@maplibre/maplibre-react-native",
      {
        // No native config needed; plugin wires up gradle deps.
      },
    ],
    withAllowBackupOff,
    withoutUpdatesNoise,
    withGeoQuery,
  ],
  experiments: {
    typedRoutes: true,
  },
};

// Expo's ExpoConfig type narrows `plugins[]` to strings/tuples and rejects inline
// ConfigPlugin functions, but the runtime accepts them. Cast on export.
export default config as ExpoConfig;
