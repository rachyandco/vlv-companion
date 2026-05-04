export const CLIMATE_DURATION_MS = 30 * 60_000; // Volvo's default cycle

/** True if the user-tracked climatisation is still expected to be running. */
export function isClimateActive(startedAt: number | undefined, now: number): boolean {
  if (!startedAt) return false;
  // Reject startedAt > now: a backward clock skew between Start and the next
  // render would otherwise satisfy `now - startedAt < CLIMATE_DURATION_MS`
  // forever (the elapsed value is negative).
  if (startedAt > now) return false;
  return now - startedAt < CLIMATE_DURATION_MS;
}

export function climateRemainingMs(startedAt: number | undefined, now: number): number {
  if (!startedAt) return 0;
  if (startedAt > now) return 0;
  // Clamp into [0, CLIMATE_DURATION_MS] so a future-dated startedAt or other
  // clock weirdness can't surface a multi-day "remaining" reading.
  return Math.min(CLIMATE_DURATION_MS, Math.max(0, CLIMATE_DURATION_MS - (now - startedAt)));
}
