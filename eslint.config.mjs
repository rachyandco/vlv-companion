import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactPlugin from "eslint-plugin-react";

const RESTRICTED = [
  {
    group: ["@react-native-firebase/*"],
    message: "Firebase pulls Google Play services. This app must run on degoogled phones.",
  },
  {
    group: ["expo-notifications", "expo-notifications/*"],
    message: "Default expo-notifications routes through FCM. Use UnifiedPush instead.",
  },
  {
    group: ["@react-native-google-signin/*", "react-native-google-signin"],
    message: "Google Sign-In requires GMS. Use the Volvo OAuth flow only.",
  },
  {
    group: ["react-native-maps"],
    message: "react-native-maps uses Google Maps SDK. Use @maplibre/maplibre-react-native instead.",
  },
  {
    group: ["expo-location"],
    message: "We read the vehicle's location from the Volvo API, never the device's GPS.",
  },
];

export default [
  {
    ignores: [
      "dist/",
      "android/",
      "node_modules/",
      ".expo/",
      "src/api/types*.gen.ts",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: "module", ecmaFeatures: { jsx: true } },
    },
    plugins: { "@typescript-eslint": tsPlugin, "react-hooks": reactHooksPlugin, react: reactPlugin },
    rules: {
      "no-restricted-imports": ["error", { patterns: RESTRICTED }],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Catches stray HTML entities like &rsquo; in <Text>, which RN renders
      // verbatim instead of decoding (unlike a browser).
      "react/no-unescaped-entities": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
    },
  },
];
