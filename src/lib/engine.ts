import type { ResourceInstanceString } from "../api/types";

export function engineLabel(field: ResourceInstanceString | undefined): string | null {
  const value = field?.value.toUpperCase();
  if (value === "RUNNING") return "Engine running";
  if (value === "STOPPED") return "Engine off";
  return null;
}
