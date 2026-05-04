import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  /** Return a truthy `false` to indicate the action was rejected without throwing. */
  onPress: () => Promise<unknown> | void;
  pending?: boolean;
  /** When set, a confirmation dialog with this title is shown before invoking. */
  confirm?: { title: string; message: string };
  variant?: "default" | "danger";
  disabled?: boolean;
};

type FlashState = null | "success" | "failure";

const FLASH_MS = 1500;

export function CommandButton({ label, onPress, pending, confirm, variant = "default", disabled }: Props): JSX.Element {
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

  const run = async () => {
    setBusy(true);
    try {
      const result = await onPress();
      // Convention: explicit `false` means "the caller chose not to flash success"
      // (e.g. it surfaced its own banner like the privacy-blocked case).
      if (result !== false) setFlash("success");
    } catch {
      setFlash("failure");
    } finally {
      setBusy(false);
    }
  };

  const handlePress = () => {
    if (busy || pending || disabled) return;
    if (!confirm) {
      void run();
      return;
    }
    Alert.alert(confirm.title, confirm.message, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", style: variant === "danger" ? "destructive" : "default", onPress: () => void run() },
    ]);
  };

  const isBusy = busy || !!pending;

  const flashBg = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(0,0,0,0)", flash === "success" ? "rgba(52,211,153,0.6)" : "rgba(239,68,68,0.6)"],
  });
  const flashBorder = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0)", flash === "success" ? "rgba(52,211,153,0.95)" : "rgba(239,68,68,0.95)"],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || isBusy, busy: isBusy }}
      onPress={handlePress}
      disabled={disabled || isBusy}
      style={({ pressed }) => [
        styles.button,
        variant === "danger" && styles.danger,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {flash ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: flashBg, borderColor: flashBorder, borderWidth: 1, borderRadius: 12 },
          ]}
        />
      ) : null}
      <View style={styles.row}>
        {isBusy ? <ActivityIndicator color="#e8eaed" /> : null}
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  danger: { borderColor: "rgba(239,68,68,0.4)", backgroundColor: "rgba(239,68,68,0.08)" },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  label: { color: "#e8eaed", fontSize: 16, fontWeight: "600" },
});
