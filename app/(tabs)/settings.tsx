import { useEffect, useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from "react-native";

const REPO_URL = "https://github.com/Rachyandco/vlv-companion";

import { useAuth } from "@/auth/AuthProvider";
import { DEFAULT_SCOPES } from "@/auth/config";
import { CommandButton } from "@/components/CommandButton";
import { CredentialFields, type CredentialValues } from "@/components/CredentialFields";
import { getRuntimeConfig, setRuntimeConfig } from "@/lib/runtimeConfig";

const EMPTY: CredentialValues = {
  clientId: "",
  clientSecret: "",
  vccApiKey: "",
  redirectUri: "",
  scopes: "",
};

export default function SettingsScreen(): JSX.Element {
  const { state, signOut } = useAuth();
  const [values, setValues] = useState<CredentialValues>(EMPTY);
  const [saving, setSaving] = useState(false);

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

  const save = async () => {
    setSaving(true);
    try {
      const before = await getRuntimeConfig();
      const next = {
        clientId: values.clientId.trim(),
        clientSecret: values.clientSecret.trim(),
        vccApiKey: values.vccApiKey.trim(),
        redirectUri: values.redirectUri.trim(),
        scopes: values.scopes.trim() || DEFAULT_SCOPES.join(" "),
      };
      await setRuntimeConfig(next);
      // Tokens are bound to the old client_id/secret AND the old scope set —
      // keeping them after either changes leads to 401s on /vehicles, refresh
      // failures (invalid_grant), or 403s on newly-added scopes. Drop the
      // cached tokens so the user is forced through a fresh OAuth flow.
      const credsChanged =
        before.clientId !== next.clientId ||
        before.clientSecret !== next.clientSecret ||
        before.vccApiKey !== next.vccApiKey ||
        before.scopes !== next.scopes;
      if (credsChanged && state.status === "signed-in") {
        await signOut();
        Alert.alert(
          "Saved",
          "Configuration changed — you've been signed out. Connect again to issue a token with the new settings.",
        );
      } else {
        Alert.alert("Saved", "Configuration updated.");
      }
    } catch (err) {
      Alert.alert("Save failed", err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Section title="Volvo developer credentials">
        <Text style={styles.help}>
          Register and publish an app at developer.volvocars.com to receive your client id and VCC API key. Set the
          redirect URI in the portal to either the default deep-link or your own HTTPS bridge URL (see below).
        </Text>
        <CredentialFields values={values} onChange={(patch) => setValues((v) => ({ ...v, ...patch }))} />
        <Text style={styles.help}>
          The portal does not accept custom-scheme URIs. Host the static page in the repo’s
          <Text style={styles.code}> redirect/ </Text>
          folder on any HTTPS endpoint (Cloudflare Pages, GitHub Pages, etc.) and paste that URL here. The page
          forwards <Text style={styles.code}>?code=&state=</Text> back into the app via deep link.
        </Text>
        <CommandButton label={saving ? "Saving…" : "Save"} onPress={save} pending={saving} />
      </Section>

      <Section title="Session">
        <Text style={styles.help}>
          Status: {state.status === "signed-in" ? "signed in" : state.status === "signed-out" ? "signed out" : "loading"}
        </Text>
        {state.status === "signed-in" ? (
          <CommandButton
            label="Sign out"
            variant="danger"
            confirm={{ title: "Sign out", message: "Tokens will be removed from this device." }}
            onPress={signOut}
          />
        ) : null}
      </Section>

      <Section title="About">
        <Text style={styles.help}>
          Vlv Companion is built for degoogled Android. It does not use Firebase, Google Maps, Play services, or
          location permission. Map tiles come from OpenFreeMap (OSM).
        </Text>
        <Text style={styles.help}>
          Source code, issue tracker, and licence:{" "}
          <Text style={styles.link} onPress={() => Linking.openURL(REPO_URL).catch(() => {})}>
            {REPO_URL}
          </Text>
        </Text>
        <Text style={styles.disclaimer}>
          Independent project. Not affiliated with, endorsed by, sponsored by, or otherwise authorised by Volvo Car
          Corporation, AB Volvo, Volvo Car USA, LLC, or any other Volvo company. The names “VOLVO”, the
          Volvo iron-mark, and any related marks are trademarks of their respective owners and are referenced here only
          to factually describe the vehicles and developer APIs this software interoperates with.
        </Text>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 20 },
  section: { gap: 10 },
  sectionTitle: { color: "#bdc1c6", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6 },
  sectionBody: { gap: 10 },
  help: { color: "#bdc1c6", fontSize: 13, lineHeight: 18 },
  link: { color: "#8ab4f8", textDecorationLine: "underline" },
  disclaimer: { color: "#9aa0a6", fontSize: 11, lineHeight: 16, fontStyle: "italic" },
  code: { fontFamily: "monospace", color: "#cfe0ff" },
});
