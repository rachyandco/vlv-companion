import { describe, expect, it } from "vitest";
import { activeWarnings, describeWarning, humanizeKey } from "./warnings";

const f = (value: string) => ({ value, updatedAt: "2026-11-06T00:00:00Z" });

describe("describeWarning", () => {
  it("treats NO_WARNING, NONE and OK as ok", () => {
    for (const v of ["NO_WARNING", "NONE", "OK", "no_warning"]) {
      expect(describeWarning(f(v))).toEqual({ text: "OK", level: "ok" });
    }
  });
  it("treats UNSPECIFIED and missing as unknown", () => {
    expect(describeWarning(f("UNSPECIFIED"))).toEqual({ text: "—", level: "unknown" });
    expect(describeWarning(undefined)).toEqual({ text: "—", level: "unknown" });
  });
  it("humanises anything else as a warning", () => {
    expect(describeWarning(f("TOO_LOW"))).toEqual({ text: "Too low", level: "warn" });
    expect(describeWarning(f("FAILURE"))).toEqual({ text: "Failure", level: "warn" });
  });
});

describe("humanizeKey", () => {
  it("splits camelCase and drops the Warning suffix", () => {
    expect(humanizeKey("brakeLightCenterWarning")).toBe("Brake light center");
    expect(humanizeKey("oilLevelWarning")).toBe("Oil level");
  });
});

describe("activeWarnings", () => {
  it("returns only non-ok, known entries", () => {
    const out = activeWarnings({
      brakeLightCenterWarning: f("NO_WARNING"),
      lowBeamLeftWarning: f("FAILURE"),
      fogLightRearWarning: f("UNSPECIFIED"),
    });
    expect(out).toEqual([{ key: "lowBeamLeftWarning", label: "Low beam left", text: "Failure" }]);
  });
  it("is empty for undefined input", () => {
    expect(activeWarnings(undefined)).toEqual([]);
  });
});
