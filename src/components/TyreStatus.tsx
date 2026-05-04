import { StyleSheet, Text, View } from "react-native";

import type { TyrePressure } from "@/api/types";

type Severity = "ok" | "warn" | "crit" | "unknown";

function severityOf(value: string | undefined): Severity {
  if (!value) return "unknown";
  const v = value.toUpperCase();
  if (v === "NORMAL") return "ok";
  if (v.startsWith("LOW_HARD") || v.startsWith("HIGH_HARD")) return "crit";
  if (v.startsWith("LOW") || v.startsWith("HIGH")) return "warn";
  return "unknown";
}

function labelOf(value: string | undefined): string {
  if (!value) return "—";
  switch (value.toUpperCase()) {
    case "NORMAL":
      return "OK";
    case "LOW_SOFT":
      return "Low";
    case "LOW_HARD":
      return "Low!";
    case "HIGH_SOFT":
      return "High";
    case "HIGH_HARD":
      return "High!";
    case "NO_SENSOR":
      return "No sensor";
    case "NOT_SUPPORTED":
    case "UNSPECIFIED":
      return "—";
    default:
      return value;
  }
}

const COLOR: Record<Severity, { bg: string; border: string; text: string }> = {
  ok: { bg: "rgba(52,211,153,0.10)", border: "rgba(52,211,153,0.45)", text: "#86efac" },
  warn: { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.45)", text: "#fbe2b3" },
  crit: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.5)", text: "#fbcaca" },
  unknown: { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.12)", text: "#bdc1c6" },
};

function Cell({ label, value }: { label: string; value: string | undefined }): JSX.Element {
  const sev = severityOf(value);
  const c = COLOR[sev];
  return (
    <View style={[styles.cell, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {labelOf(value)}
      </Text>
    </View>
  );
}

export function TyreStatus({ tyres }: { tyres?: TyrePressure }): JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tyre pressure</Text>
      <View style={styles.row}>
        <Cell label="Front-left" value={tyres?.frontLeft?.value} />
        <Cell label="Front-right" value={tyres?.frontRight?.value} />
      </View>
      <View style={styles.row}>
        <Cell label="Rear-left" value={tyres?.rearLeft?.value} />
        <Cell label="Rear-right" value={tyres?.rearRight?.value} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  title: { color: "#bdc1c6", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6 },
  row: { flexDirection: "row", gap: 12 },
  cell: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  label: { color: "#bdc1c6", fontSize: 12 },
  value: { fontSize: 16, fontWeight: "600", fontFamily: "monospace" },
});
