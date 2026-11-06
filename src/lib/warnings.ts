import type { ExteriorWarnings, ResourceInstanceString } from "../api/types";

export type WarningLevel = "ok" | "warn" | "unknown";

const OK_VALUES = new Set(["NO_WARNING", "NONE", "OK"]);
const UNKNOWN_VALUES = new Set(["UNSPECIFIED"]);

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const humanizeValue = (value: string) => capitalise(value.toLowerCase().replace(/_/g, " "));

export function describeWarning(field: ResourceInstanceString | undefined): {
  text: string;
  level: WarningLevel;
} {
  if (!field) return { text: "—", level: "unknown" };
  const value = field.value.toUpperCase();
  if (OK_VALUES.has(value)) return { text: "OK", level: "ok" };
  if (UNKNOWN_VALUES.has(value)) return { text: "—", level: "unknown" };
  return { text: humanizeValue(field.value), level: "warn" };
}

export function humanizeKey(key: string): string {
  const base = key.replace(/Warning$/, "");
  const spaced = base.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return capitalise(spaced);
}

export function activeWarnings(
  warnings: ExteriorWarnings | undefined,
): { key: string; label: string; text: string }[] {
  if (!warnings) return [];
  return Object.entries(warnings).flatMap(([key, field]) => {
    const { text, level } = describeWarning(field);
    return level === "warn" ? [{ key, label: humanizeKey(key), text }] : [];
  });
}
