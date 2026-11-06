import { DEFAULT_SCOPES } from "@/auth/config";

// Scopes that older builds' default list lacked. A stored list that is exactly
// an older default set (ignoring order) is upgraded to the current default;
// a list the user customised is left alone.
const SCOPES_ADDED_LATER = ["conve:diagnostics_workshop"];

/** Returns the new space-separated list, or null when nothing changes. */
export function upgradeDefaultScopes(stored: string): string | null {
  const list = stored.split(/\s+/).filter(Boolean);
  if (list.length === 0) return null;
  const current = new Set(DEFAULT_SCOPES);
  const older = new Set(DEFAULT_SCOPES.filter((s) => !SCOPES_ADDED_LATER.includes(s)));
  const have = new Set(list);
  const sameAs = (set: Set<string>) => set.size === have.size && [...set].every((s) => have.has(s));
  if (sameAs(current) || !sameAs(older)) return null;
  return DEFAULT_SCOPES.join(" ");
}
