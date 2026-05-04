import { useEffect, useState } from "react";
import { Alert, Linking, ScrollView, Share, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/auth/AuthProvider";
import { DEFAULT_REDIRECT_URI, DEFAULT_SCOPES } from "@/auth/config";
import { CommandButton } from "@/components/CommandButton";
import { CredentialFields, type CredentialValues } from "@/components/CredentialFields";
import { getRuntimeConfig, setRuntimeConfig } from "@/lib/runtimeConfig";

function usingDefaultRedirect(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === "" || trimmed === DEFAULT_REDIRECT_URI;
}

const EMPTY: CredentialValues = {
  clientId: "",
  clientSecret: "",
  vccApiKey: "",
  redirectUri: "",
  scopes: "",
};

export default function SignInScreen(): JSX.Element {
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState<CredentialValues>(EMPTY);

  useEffect(() => {
    void (async () => {
      const cfg = await getRuntimeConfig();
      setValues({
        clientId: cfg.clientId,
        clientSecret: cfg.clientSecret,
        vccApiKey: cfg.vccApiKey,
        redirectUri: cfg.redirectUri,
        scopes: cfg.scopes,
      });
    })();
  }, []);

  const handleSignIn = async () => {
    setBusy(true);
    try {
      await setRuntimeConfig({
        clientId: values.clientId.trim(),
        clientSecret: values.clientSecret.trim(),
        vccApiKey: values.vccApiKey.trim(),
        redirectUri: values.redirectUri.trim() || DEFAULT_REDIRECT_URI,
        scopes: values.scopes.trim() || DEFAULT_SCOPES.join(" "),
      });
      const cfg = await getRuntimeConfig();
      if (!cfg.clientId || !cfg.vccApiKey) {
        Alert.alert("Configuration missing", "Both the OAuth client id and VCC API key are required.");
        return;
      }
      // Force Volvo's IdP to re-run login + vehicle-picker consent. Without
      // prompt=login it can replay a cached session whose consent has 0
      // vehicles selected, which makes /vehicles return an empty list.
      await signIn({ prompt: "login" });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      const url = (err as { authorizeUrl?: string } | null)?.authorizeUrl;
      if (url) {
        Alert.alert(
          "Sign-in failed",
          `${reason}\n\nOpen the authorize URL in a regular browser tab to see Volvo's exact error page. You can paste it back here for diagnosis.`,
          [
            { text: "Close", style: "cancel" },
            { text: "Share URL", onPress: () => Share.share({ message: url }).catch(() => {}) },
            { text: "Open in browser", onPress: () => Linking.openURL(url).catch(() => {}) },
          ],
        );
      } else {
        Alert.alert("Sign-in failed", reason);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>Vlv Companion</Text>
        <Text style={styles.subtitle}>
          Connect your Volvo account to read vehicle status and send commands. No Google services required.
        </Text>
        <Text style={styles.disclaimer}>
          Independent project. Not affiliated with, endorsed by, or sponsored by Volvo Car Corporation, AB Volvo, or
          their affiliates.
        </Text>
      </View>

      <CredentialFields values={values} onChange={(patch) => setValues((v) => ({ ...v, ...patch }))} />

      {usingDefaultRedirect(values.redirectUri) ? (
        <View style={styles.warning}>
          <Text style={styles.warningTitle}>Using a third-party default bridge</Text>
          <Text style={styles.warningBody}>
            Leaving Redirect URI blank routes the OAuth callback through{" "}
            <Text style={styles.code}>{DEFAULT_REDIRECT_URI}</Text>, a personal domain not run by
            Volvo or this project. PKCE keeps your access token off that server, but the auth code
            transits it (and appears in its logs). For the strongest guarantees, host the page in
            <Text style={styles.code}> redirect/ </Text>
            on your own HTTPS endpoint and paste that URL above.
          </Text>
        </View>
      ) : null}

      <CommandButton label={busy ? "Opening browser…" : "Connect Volvo account"} onPress={handleSignIn} pending={busy} />

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Volvo portal won’t accept custom-scheme redirects</Text>
        <Text style={styles.noticeBody}>
          The portal requires an <Text style={styles.code}>https://</Text> redirect URI. Host the static page from the
          repo’s <Text style={styles.code}>redirect/</Text> folder on any HTTPS endpoint (Cloudflare Pages, GitHub
          Pages, Vercel, etc.). Register that URL in the portal AND paste it above. The page bounces the OAuth response
          back into the app via the deep link <Text style={styles.code}>volvo-companion://oauth/callback</Text>.
        </Text>
        <Text style={styles.noticeBody}>
          Also confirm your developer-portal app is in the <Text style={styles.code}>Published</Text> state — an
          unpublished app yields <Text style={styles.code}>invalid_request</Text>.
        </Text>
      </View>

      <Text style={styles.fineprint}>
        OAuth runs in your system browser via PKCE. Tokens stay on the device in the Android Keystore.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 20, flexGrow: 1, justifyContent: "center" },
  hero: { gap: 8 },
  title: { color: "#e8eaed", fontSize: 28, fontWeight: "700" },
  subtitle: { color: "#bdc1c6", fontSize: 15, lineHeight: 22 },
  disclaimer: { color: "#9aa0a6", fontSize: 11, lineHeight: 16, marginTop: 4 },
  notice: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(245,158,11,0.08)",
    borderColor: "rgba(245,158,11,0.4)",
    borderWidth: 1,
    gap: 8,
  },
  noticeTitle: { color: "#fbe2b3", fontWeight: "700" },
  noticeBody: { color: "#fbe2b3", fontSize: 13, lineHeight: 18 },
  warning: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderColor: "rgba(239,68,68,0.4)",
    borderWidth: 1,
    gap: 6,
  },
  warningTitle: { color: "#fbcaca", fontWeight: "700" },
  warningBody: { color: "#fbcaca", fontSize: 13, lineHeight: 18 },
  code: { fontFamily: "monospace", color: "#fff1cf" },
  fineprint: { color: "#bdc1c6", fontSize: 12, lineHeight: 18, textAlign: "center" },
});
