import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Alert, Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { bucketOf, friendlyMessage } from "@/api/commands";
import type { ResourceInstanceString } from "@/api/types";
import { useInvokeCommand } from "@/hooks/useInvokeCommand";

type Props = {
  vin: string;
  centralLock?: ResourceInstanceString;
};

type FlashState = null | "success" | "failure";
const FLASH_MS = 1500;

export function LockTile({ vin, centralLock }: Props): JSX.Element {
  const invoke = useInvokeCommand();

  // Optimistic value: when a command succeeds we flip immediately and trust
  // the optimistic state until the real /doors fetch returns the new value
  // (or until the optimistic value times out).
  const [optimistic, setOptimistic] = useState<{ value: "LOCKED" | "UNLOCKED"; at: number } | null>(null);

  // Drop the optimistic value once the real data agrees with it OR after 30s.
  useEffect(() => {
    if (!optimistic) return;
    if (centralLock?.value === optimistic.value) {
      setOptimistic(null);
      return;
    }
    const timer = setTimeout(() => setOptimistic(null), 30_000);
    return () => clearTimeout(timer);
  }, [centralLock?.value, optimistic]);

  const effectiveValue = optimistic?.value ?? centralLock?.value;
  const isLocked = effectiveValue === "LOCKED";
  const knownState = effectiveValue === "LOCKED" || effectiveValue === "UNLOCKED";

  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<FlashState>(null);
  const flashAnim = useRef(new Animated.Value(0)).current;
  // Track mount so the Animated.timing.start callback doesn't setFlash(null)
  // on an unmounted component under React concurrent rendering.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!flash) return;
    flashAnim.setValue(1);
    const timer = setTimeout(() => {
      Animated.timing(flashAnim, { toValue: 0, duration: 600, useNativeDriver: false }).start(() => {
        if (mountedRef.current) setFlash(null);
      });
    }, FLASH_MS - 600);
    return () => {
      clearTimeout(timer);
      flashAnim.stopAnimation();
    };
  }, [flash, flashAnim]);

  const performToggle = async () => {
    setBusy(true);
    try {
      const command = isLocked ? "unlock" : "lock";
      const expected = isLocked ? "UNLOCKED" : "LOCKED";
      const response = await invoke.mutateAsync({ vin, command });
      const bucket = bucketOf(response.data.invokeStatus);
      if (bucket === "failure" || bucket === "user-actionable") {
        Alert.alert(
          isLocked ? "Unlock failed" : "Lock failed",
          friendlyMessage(response.data.invokeStatus, response.data.message),
        );
        setFlash("failure");
        return;
      }
      setOptimistic({ value: expected, at: Date.now() });
      setFlash("success");
    } catch (err) {
      Alert.alert("Command failed", err instanceof Error ? err.message : String(err));
      setFlash("failure");
    } finally {
      setBusy(false);
    }
  };

  const handlePress = () => {
    if (busy) return;
    if (isLocked) {
      // Unlock requires confirmation — Volvo's "ready to unlock" window is short
      // and you must physically pull a door handle to actually open.
      Alert.alert(
        "Unlock car",
        "After confirming, pull a door handle within the unlock window to open it.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Unlock", style: "destructive", onPress: () => void performToggle() },
        ],
      );
    } else {
      void performToggle();
    }
  };

  const flashBg = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(0,0,0,0)", flash === "success" ? "rgba(52,211,153,0.6)" : "rgba(239,68,68,0.6)"],
  });

  const iconName = isLocked ? "lock-closed" : "lock-open";
  const stateLabel = !knownState ? "—" : isLocked ? "Locked" : "Unlocked";
  const actionLabel = !knownState ? "Lock state unknown" : isLocked ? "Tap to unlock" : "Tap to lock";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Central lock — ${stateLabel}`}
      accessibilityHint={actionLabel}
      accessibilityState={{ disabled: busy, busy }}
      onPress={handlePress}
      disabled={busy}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      {flash ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: flashBg, borderRadius: 16 }]} />
      ) : null}
      <View style={styles.row}>
        <View style={[styles.iconBubble, isLocked ? styles.iconLocked : styles.iconUnlocked]}>
          {busy ? (
            <ActivityIndicator color="#0b0c0f" />
          ) : (
            <Ionicons name={iconName} size={26} color={isLocked ? "#0b3a26" : "#3b1011"} />
          )}
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.label}>Central lock</Text>
          <Text style={styles.value}>{stateLabel}</Text>
          <Text style={styles.hint}>{actionLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: "100%",
    minWidth: "100%",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(64,128,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(64,128,255,0.32)",
    overflow: "hidden",
  },
  pressed: { opacity: 0.85 },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  iconLocked: { backgroundColor: "#34d399" },
  iconUnlocked: { backgroundColor: "#ef4444" },
  textWrap: { flex: 1, gap: 2 },
  label: { color: "#9aa0a6", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6 },
  value: { color: "#e8eaed", fontSize: 22, fontWeight: "700" },
  hint: { color: "#bdc1c6", fontSize: 12 },
});
