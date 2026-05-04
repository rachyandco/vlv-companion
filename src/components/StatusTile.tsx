import { StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  unsupported?: boolean;
};

export function StatusTile({ label, value, hint, unsupported }: Props): JSX.Element {
  return (
    <View style={[styles.tile, unsupported && styles.unsupported]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {value}
      </Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 140,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 4,
  },
  unsupported: {
    opacity: 0.4,
  },
  label: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#bdc1c6",
  },
  value: {
    fontSize: 22,
    fontWeight: "600",
    color: "#e8eaed",
  },
  hint: {
    fontSize: 12,
    color: "#bdc1c6",
  },
});
