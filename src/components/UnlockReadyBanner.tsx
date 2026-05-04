import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  /** Epoch ms when the unlock window expires. */
  readyToUnlockUntil: number;
};

export function UnlockReadyBanner({ readyToUnlockUntil }: Props): JSX.Element | null {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remainingMs = Math.max(0, readyToUnlockUntil - now);
  if (remainingMs === 0) return null;
  const remainingS = Math.ceil(remainingMs / 1000);

  return (
    <View style={styles.banner}>
      <Text style={styles.title}>Ready to unlock</Text>
      <Text style={styles.body}>Pull a door handle within {remainingS}s.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "rgba(64,128,255,0.18)",
    borderColor: "rgba(64,128,255,0.5)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  title: { color: "#cfe0ff", fontWeight: "700" },
  body: { color: "#cfe0ff" },
});
