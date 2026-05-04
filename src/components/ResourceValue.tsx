import type { EnergyField, ResourceInstanceFloat, ResourceInstanceInteger, ResourceInstanceString } from "@/api/types";

type Resource =
  | ResourceInstanceString
  | ResourceInstanceInteger
  | ResourceInstanceFloat
  | { value: number; updatedAt: string; unit: string }
  | EnergyField<unknown>
  | undefined
  | null;

const DASH = "—";

export function renderResource(resource: Resource, fallback = DASH, format?: (value: unknown) => string): string {
  return render(resource, fallback, format);
}

function render(resource: Resource, fallback: string, format?: (value: unknown) => string): string {
  if (!resource) return fallback;
  if ("status" in resource) {
    if (resource.status === "ERROR") return fallback;
    return formatValue(resource.value, "unit" in resource ? resource.unit : undefined, format);
  }
  return formatValue(
    (resource as ResourceInstanceString).value,
    "unit" in resource ? (resource as { unit?: string }).unit : undefined,
    format,
  );
}

function formatValue(value: unknown, unit?: string, format?: (value: unknown) => string): string {
  if (format) return format(value);
  if (typeof value === "number") {
    const rounded = Math.round(value * 100) / 100;
    return unit ? `${rounded} ${unit}` : String(rounded);
  }
  if (typeof value === "string") {
    return unit ? `${value} ${unit}` : value;
  }
  return String(value ?? "");
}
