import { describe, expect, it } from "vitest";
import { engineLabel } from "./engine";
const f = (value: string) => ({ value, updatedAt: "2026-11-06T00:00:00Z" });
describe("engineLabel", () => {
  it("maps RUNNING and STOPPED", () => {
    expect(engineLabel(f("RUNNING"))).toBe("Engine running");
    expect(engineLabel(f("stopped"))).toBe("Engine off");
  });
  it("returns null for unknown values", () => {
    expect(engineLabel(f("UNSPECIFIED"))).toBeNull();
    expect(engineLabel(undefined)).toBeNull();
  });
});
