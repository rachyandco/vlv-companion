import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CommandButton } from "@/components/CommandButton";
import { UnlockReadyBanner } from "@/components/UnlockReadyBanner";
import { useCommandAccessibility } from "@/hooks/useVehicle";
import { useInvokeCommand } from "@/hooks/useInvokeCommand";
import { useVehiclePrefs } from "@/hooks/useVehiclePrefs";
import { useVin } from "@/hooks/useVin";
import { climateRemainingMs, isClimateActive, useClimateStore } from "@/state/climate";
import { bucketOf, friendlyMessage } from "@/api/commands";
import type { CommandName, InvokeUnlock } from "@/api/types";

export default function CommandsScreen(): JSX.Element {
  const vin = useVin();
  const { isEV } = useVehiclePrefs(vin);
  const access = useCommandAccessibility(vin);
  const invoke = useInvokeCommand();
  const [unlockUntil, setUnlockUntil] = useState<number | null>(null);
  const [engineRuntime, setEngineRuntime] = useState(5);

  // Self-clear unlockUntil once the window passes; the banner already
  // self-hides, this just keeps the state honest so a re-render doesn't
  // briefly show "ready to unlock" with a stale timestamp.
  useEffect(() => {
    if (!unlockUntil) return;
    const remaining = unlockUntil - Date.now();
    if (remaining <= 0) {
      setUnlockUntil(null);
      return;
    }
    const t = setTimeout(() => setUnlockUntil(null), remaining);
    return () => clearTimeout(t);
  }, [unlockUntil]);

  // Volvo's /commands endpoint returns names in UPPER_SNAKE_CASE
  // (`HONK_AND_FLASH`) that don't 1:1 map to our kebab-case POST paths
  // (`honk-flash`). Skip the gating and let the API's `NOT_SUPPORTED`
  // invokeStatus drive the user-facing toast.

  const reachable = access.data?.data.availabilityStatus?.value;
  const unreachableReason = access.data?.data.availabilityStatus?.unavailableReason;

  // Client-side optimistic climatisation tracking — Volvo's public API doesn't
  // expose climate status, so we record the user's last successful Start and
  // assume it ran the default 30-minute cycle.
  const climateStartedAt = useClimateStore((s) => s.startedAt[vin]);
  const startClimate = useClimateStore((s) => s.start);
  const stopClimate = useClimateStore((s) => s.stop);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!climateStartedAt) return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [climateStartedAt]);
  const climateOn = isClimateActive(climateStartedAt, now);
  const climateRemaining = climateRemainingMs(climateStartedAt, now);
  // Volvo's `command-accessibility` reports connectivity only — privacy mode
  // isn't surfaced anywhere queryable. Learn it from the first failed POST
  // and remember it until the next successful command clears it.
  const [privacyBlocked, setPrivacyBlocked] = useState(false);

  const isAvailable = reachable === "AVAILABLE" && !privacyBlocked;
  const blockMessage = privacyBlocked
    ? humanizeReason("PRIVACY_ENABLED")
    : reachable && reachable !== "AVAILABLE"
      ? humanizeReason(unreachableReason ?? reachable)
      : null;

  /**
   * Returns true on success / accepted (button flashes green),
   * returns false when handled silently (e.g. privacy banner takes over),
   * throws on failure (button flashes red and we show an Alert with detail).
   */
  const run = async (command: CommandName, body?: { runtimeMinutes: number }): Promise<boolean> => {
    try {
      const response = await invoke.mutateAsync({ vin, command, body });
      const data = response.data;
      const bucket = bucketOf(data.invokeStatus);
      // Successful POST means privacy is off; clear any sticky banner.
      setPrivacyBlocked(false);
      const accepted = bucket === "success" || bucket === "pending";
      if (command === "climatization-start" && accepted) {
        startClimate(vin);
      } else if (command === "climatization-stop" && accepted) {
        stopClimate(vin);
      }
      if (command === "unlock") {
        const unlock = data as InvokeUnlock;
        if (unlock.readyToUnlock && unlock.readyToUnlockUntil) {
          setUnlockUntil(unlock.readyToUnlockUntil);
        }
      }
      // Privacy mode is the one failure we surface as a sticky banner instead
      // of an alert + red flash. Match the raw invokeStatus rather than the
      // humanized message — friendlyMessage() copy could change and any other
      // error containing "privacy" would otherwise silently disable commands.
      if (data.invokeStatus === "NOT_ALLOWED_PRIVACY_ENABLED") {
        setPrivacyBlocked(true);
        return false;
      }
      if (bucket === "failure" || bucket === "user-actionable") {
        throw new Error(friendlyMessage(data.invokeStatus, data.message));
      }
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert("Command failed", message);
      throw err; // let CommandButton flash red
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: reachable === "AVAILABLE" ? "#34d399" : "#f59e0b" }]} />
          <Text style={styles.statusText}>{reachable ?? "Checking accessibility…"}</Text>
        </View>

        {unlockUntil ? <UnlockReadyBanner readyToUnlockUntil={unlockUntil} /> : null}

        {blockMessage ? (
          <View style={styles.blockBanner}>
            <Text style={styles.blockTitle}>Commands unavailable</Text>
            <Text style={styles.blockBody}>{blockMessage}</Text>
          </View>
        ) : null}

        <Section title="Locking">
          <CommandButton label="Lock" onPress={() => run("lock")} disabled={!isAvailable} />
          <CommandButton
            label="Lock (reduced guard)"
            confirm={{
              title: "Reduced-guard lock",
              message: "Locks without arming the interior motion sensor. Use when leaving a pet or item inside.",
            }}
            onPress={() => run("lock-reduced-guard")} disabled={!isAvailable}
           
          />
          <CommandButton
            label="Unlock"
            confirm={{ title: "Unlock car", message: "After confirming, pull the door handle within the unlock window." }}
            variant="danger"
            onPress={() => run("unlock")} disabled={!isAvailable}
           
          />
        </Section>

        <Section title="Find my car">
          <CommandButton label="Honk" onPress={() => run("honk")} disabled={!isAvailable} />
          <CommandButton label="Flash" onPress={() => run("flash")} disabled={!isAvailable} />
          <CommandButton label="Honk and flash" onPress={() => run("honk-flash")} disabled={!isAvailable} />
        </Section>

        <Section title="Climate">
          {climateOn ? (
            <View style={styles.climateBanner}>
              <View style={styles.climateBannerDot} />
              <Text style={styles.climateBannerText}>
                Climatisation running — about {Math.ceil(climateRemaining / 60_000)} min left
              </Text>
              <Text style={styles.climateBannerHint}>
                Volvo’s public API doesn’t expose live climate status; this is tracked locally from your last
                Start.
              </Text>
            </View>
          ) : null}
          <CommandButton
            label="Start climatisation"
            onPress={() => run("climatization-start")} disabled={!isAvailable}
          />
          <CommandButton
            label="Stop climatisation"
            onPress={() => run("climatization-stop")} disabled={!isAvailable || !climateOn}
          />
        </Section>

        {isEV ? null : (
          <Section title="Engine">
            <RuntimePicker minutes={engineRuntime} onChange={setEngineRuntime} />
            <CommandButton
              label={`Start engine (${engineRuntime} min)`}
              confirm={{
                title: "Start engine",
                message: `Run the engine for ${engineRuntime} minutes. Make sure the car is in a ventilated area.`,
              }}
              variant="danger"
              onPress={() => run("engine-start", { runtimeMinutes: engineRuntime })}
              disabled={!isAvailable}
            />
            <CommandButton
              label="Stop engine"
              onPress={() => run("engine-stop")}
              disabled={!isAvailable}
            />
          </Section>
        )}
      </ScrollView>
    </View>
  );
}

function humanizeReason(raw: string): string {
  const upper = raw.toUpperCase();
  if (upper.includes("PRIVACY")) return "Privacy mode is enabled in the car. Disable it from the central display → Settings → Privacy.";
  if (upper.includes("CAR_IN_USE") || upper.includes("IN_USE")) return "The car is currently being driven. Commands are blocked while the vehicle is in motion.";
  if (upper.includes("SLEEP")) return "The car is in deep sleep. It may take up to a minute to wake up — try again shortly.";
  if (upper.includes("NOT_REACHABLE") || upper.includes("NO_CONNECTION")) return "The car is unreachable. Make sure it has cell coverage.";
  if (upper.includes("ENGINE_RUNNING")) return "The engine is running. Some commands aren't available while driving.";
  if (upper.includes("CHARGING")) return "The car is busy charging.";
  if (upper === "UNAVAILABLE" || upper === "NOT_AVAILABLE") return "The car is currently unavailable.";
  return raw.replaceAll("_", " ").toLowerCase();
}

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function RuntimePicker({ minutes, onChange }: { minutes: number; onChange: (v: number) => void }): JSX.Element {
  return (
    <View style={styles.runtimeRow}>
      <Text style={styles.runtimeLabel}>Runtime</Text>
      <View style={styles.runtimeButtons}>
        {[1, 5, 10, 15].map((m) => (
          <Pressable
            key={m}
            accessibilityRole="button"
            accessibilityLabel={`${m} minutes`}
            accessibilityState={{ selected: minutes === m }}
            onPress={() => onChange(m)}
            style={[styles.runtimeChip, minutes === m && styles.runtimeChipActive]}
          >
            <Text style={[styles.runtimeChipText, minutes === m && styles.runtimeChipTextActive]}>{m}m</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { padding: 16, gap: 20 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { color: "#bdc1c6", fontSize: 14 },
  section: { gap: 8 },
  sectionTitle: { color: "#bdc1c6", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6 },
  sectionBody: { gap: 8 },
  runtimeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  runtimeLabel: { color: "#e8eaed" },
  runtimeButtons: { flexDirection: "row", gap: 6 },
  runtimeChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  runtimeChipActive: { backgroundColor: "rgba(64,128,255,0.18)", borderColor: "rgba(64,128,255,0.5)" },
  runtimeChipText: { color: "#bdc1c6", fontWeight: "600" },
  runtimeChipTextActive: { color: "#cfe0ff" },
  blockBanner: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(245,158,11,0.12)",
    borderColor: "rgba(245,158,11,0.5)",
    borderWidth: 1,
    gap: 4,
  },
  blockTitle: { color: "#fbe2b3", fontWeight: "700" },
  blockBody: { color: "#fbe2b3", fontSize: 13, lineHeight: 18 },
  climateBanner: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(52,211,153,0.12)",
    borderColor: "rgba(52,211,153,0.4)",
    borderWidth: 1,
    gap: 4,
  },
  climateBannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34d399",
    marginBottom: 2,
  },
  climateBannerText: { color: "#bcf2dd", fontWeight: "700" },
  climateBannerHint: { color: "#bcf2dd", fontSize: 12, lineHeight: 16, opacity: 0.8 },
});
