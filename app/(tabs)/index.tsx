import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/auth/AuthProvider";
import { DEFAULT_SCOPES } from "@/auth/config";
import { useVehiclePrefs } from "@/hooks/useVehiclePrefs";
import { useVehicles, VEHICLES_KEY } from "@/hooks/useVehicles";
import { setRuntimeConfig } from "@/lib/runtimeConfig";

// Session-scoped guard for the single-vehicle auto-redirect. A useRef would
// reset every time the GarageScreen remounts (e.g. when the user navigates
// back from the vehicle tabs), which would re-trigger the auto-jump. Module
// scope persists for the life of the JS bundle — exactly the right window.
let autoJumped = false;

function isSessionExpired(error: Error | null | undefined): boolean {
  if (!error) return false;
  const status = (error as Error & { status?: number }).status;
  if (status === 401) return true;
  return /invalid[_ ]grant|refresh.token|please sign in/i.test(error.message ?? "");
}

export default function GarageScreen(): JSX.Element {
  const { data, isLoading, isRefetching, refetch, error } = useVehicles();
  const { signIn } = useAuth();
  const queryClient = useQueryClient();
  const [reconnecting, setReconnecting] = useState(false);
  const router = useRouter();

  const reconnect = () => {
    if (reconnecting) return;
    setReconnecting(true);
    void (async () => {
      try {
        // A previous build defaulted scopes to just "openid"; if that landed
        // in SecureStore it survives default-list updates. Reset to the
        // current full set before re-authorising so the new token can read
        // /vehicles.
        await setRuntimeConfig({ scopes: DEFAULT_SCOPES.join(" ") });
        // prompt=login forces Volvo's IdP to re-run the login + vehicle-picker
        // consent flow — otherwise it can replay a cached session whose
        // consent has 0 vehicles selected, and /vehicles stays empty.
        await signIn({ prompt: "login" });
        await queryClient.invalidateQueries({ queryKey: VEHICLES_KEY });
      } catch (err) {
        // signIn() throws on cancel/failure but doesn't render its own UI
        // when invoked from here; surface a banner so the user gets feedback.
        Alert.alert("Reconnect failed", err instanceof Error ? err.message : String(err));
      } finally {
        setReconnecting(false);
      }
    })();
  };

  // Auto-jump to the only vehicle's Overview if exactly one is linked. Fire
  // at most once per session (see autoJumped at module scope above).
  useEffect(() => {
    if (autoJumped) return;
    const vehicles = data?.data;
    if (vehicles && vehicles.length === 1) {
      const only = vehicles[0];
      if (only?.vin) {
        autoJumped = true;
        router.replace({ pathname: "/(tabs)/vehicle/[vin]", params: { vin: only.vin } });
      }
    }
  }, [data, router]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#e8eaed" />}
    >
      <Text style={styles.title}>Your vehicles</Text>
      {isLoading ? <ActivityIndicator color="#e8eaed" /> : null}
      {error ? (
        isSessionExpired(error) ? (
          <View style={styles.expired}>
            <Text style={styles.expiredTitle}>Session expired</Text>
            <Pressable
              onPress={reconnect}
              disabled={reconnecting}
              style={({ pressed }) => [styles.reconnect, pressed && styles.pressed]}
            >
              <Text style={styles.reconnectLabel}>{reconnecting ? "Reconnecting…" : "Reconnect"}</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.error}>{error.message}</Text>
        )
      ) : null}
      {!isLoading && !error && data?.data.length === 0 ? (
        <View style={styles.expired}>
          <Text style={styles.expiredTitle}>No vehicles linked to this Volvo account</Text>
          <Text style={styles.empty}>
            The OAuth consent may not have included a vehicle. Reconnect to re-run the Volvo login and vehicle picker.
          </Text>
          <Pressable
            onPress={reconnect}
            disabled={reconnecting}
            style={({ pressed }) => [styles.reconnect, pressed && styles.pressed]}
          >
            <Text style={styles.reconnectLabel}>{reconnecting ? "Reconnecting…" : "Reconnect"}</Text>
          </Pressable>
        </View>
      ) : null}
      {data?.data.map((v) => (
        <VehicleCard
          key={v.vin}
          vin={v.vin}
          onOpen={() =>
            router.push({ pathname: "/(tabs)/vehicle/[vin]", params: { vin: v.vin } })
          }
        />
      ))}
    </ScrollView>
  );
}

function VehicleCard({ vin, onOpen }: { vin: string; onOpen: () => void }): JSX.Element {
  const { name, isEV, setName, setIsEV } = useVehiclePrefs(vin);
  // Local mirror of the persisted name so the TextInput is controlled (resyncs
  // when vehiclePrefs changes elsewhere) but doesn't dispatch a write per
  // keystroke — only on blur / submit.
  const [draft, setDraft] = useState(name ?? "");
  useEffect(() => {
    setDraft(name ?? "");
  }, [name]);
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Name</Text>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onEndEditing={() => {
          if (draft !== (name ?? "")) void setName(draft);
        }}
        placeholder="e.g. The car"
        placeholderTextColor="#7f868d"
        autoCapitalize="words"
        style={styles.nameInput}
      />

      <Pressable
        onPress={() => {
          void setIsEV(!isEV);
        }}
        style={({ pressed }) => [styles.checkboxRow, pressed && styles.pressed]}
      >
        <View style={[styles.checkbox, isEV && styles.checkboxChecked]}>
          {isEV ? <Ionicons name="checkmark" size={16} color="#0b3a26" /> : null}
        </View>
        <Text style={styles.checkboxLabel}>Electric vehicle</Text>
        <Text style={styles.checkboxHint}>hides fuel + engine controls</Text>
      </Pressable>

      <Text style={styles.cardLabel}>VIN</Text>
      <Text style={styles.cardVin}>{vin}</Text>
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}
      >
        <Text style={styles.openLabel}>Open</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { color: "#e8eaed", fontSize: 24, fontWeight: "700", marginBottom: 4 },
  empty: { color: "#bdc1c6" },
  error: { color: "#fbcaca" },
  expired: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(245,158,11,0.08)",
    borderColor: "rgba(245,158,11,0.4)",
    borderWidth: 1,
    gap: 12,
    alignItems: "flex-start",
  },
  expiredTitle: { color: "#fbe2b3", fontSize: 16, fontWeight: "700" },
  reconnect: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "rgba(64,128,255,0.18)",
    borderColor: "rgba(64,128,255,0.5)",
    borderWidth: 1,
  },
  reconnectLabel: { color: "#cfe0ff", fontWeight: "700" },
  card: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 6,
  },
  pressed: { opacity: 0.7 },
  cardLabel: { color: "#bdc1c6", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6 },
  cardVin: { color: "#e8eaed", fontSize: 15, fontFamily: "monospace" },
  nameInput: {
    color: "#e8eaed",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 4,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    flexWrap: "wrap",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.32)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#34d399",
    borderColor: "#34d399",
  },
  checkboxLabel: { color: "#e8eaed", fontSize: 15, fontWeight: "600" },
  checkboxHint: { color: "#bdc1c6", fontSize: 12 },
  openButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "rgba(64,128,255,0.18)",
    borderColor: "rgba(64,128,255,0.5)",
    borderWidth: 1,
    alignItems: "center",
  },
  openLabel: { color: "#cfe0ff", fontWeight: "700" },
});
