import { describe, expect, it } from "vitest";

import { isLegacyClientId } from "./migration";

describe("isLegacyClientId", () => {
  it("flags the pre-Keycloak dc- prefix", () => {
    expect(isLegacyClientId("dc-abc123")).toBe(true);
    expect(isLegacyClientId("  DC-abc123 ")).toBe(true);
  });

  it("accepts the new vid- prefixes and anything else", () => {
    expect(isLegacyClientId("vid-dc-abc123")).toBe(false);
    expect(isLegacyClientId("vid-dcr-abc123")).toBe(false);
    expect(isLegacyClientId("")).toBe(false);
    expect(isLegacyClientId("something-dc-")).toBe(false);
  });
});
