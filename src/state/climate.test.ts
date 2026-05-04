import { describe, expect, it } from "vitest";

import { climateRemainingMs, isClimateActive } from "./climateMath";

const ONE_MINUTE = 60_000;
const THIRTY_MINUTES = 30 * ONE_MINUTE;

describe("isClimateActive", () => {
  it("returns false when there is no startedAt", () => {
    expect(isClimateActive(undefined, Date.now())).toBe(false);
  });

  it("is active just before the 30-minute mark", () => {
    const now = 1_000_000;
    expect(isClimateActive(now - (THIRTY_MINUTES - 1), now)).toBe(true);
  });

  it("is inactive at or past the 30-minute mark", () => {
    const now = 1_000_000;
    expect(isClimateActive(now - THIRTY_MINUTES, now)).toBe(false);
    expect(isClimateActive(now - (THIRTY_MINUTES + 1), now)).toBe(false);
  });

  it("rejects future startedAt (clock skew defense)", () => {
    const now = 1_000_000;
    expect(isClimateActive(now + ONE_MINUTE, now)).toBe(false);
  });
});

describe("climateRemainingMs", () => {
  it("returns 0 when there is no startedAt", () => {
    expect(climateRemainingMs(undefined, Date.now())).toBe(0);
  });

  it("counts down the full duration immediately after start", () => {
    const now = 1_000_000;
    expect(climateRemainingMs(now, now)).toBe(THIRTY_MINUTES);
  });

  it("clamps at 0 once the duration has elapsed", () => {
    const now = 1_000_000;
    expect(climateRemainingMs(now - (THIRTY_MINUTES + ONE_MINUTE), now)).toBe(0);
  });

  it("returns 0 for future startedAt instead of a huge value", () => {
    const now = 1_000_000;
    expect(climateRemainingMs(now + ONE_MINUTE, now)).toBe(0);
  });
});
