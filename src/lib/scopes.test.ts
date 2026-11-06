import { describe, expect, it } from "vitest";

import { DEFAULT_SCOPES } from "@/auth/config";
import { upgradeDefaultScopes } from "./scopes";

const OLD_DEFAULTS = DEFAULT_SCOPES.filter((s) => s !== "conve:diagnostics_workshop");

describe("upgradeDefaultScopes", () => {
  it("upgrades a stored list that equals the previous default set", () => {
    expect(upgradeDefaultScopes(OLD_DEFAULTS.join(" "))).toBe(DEFAULT_SCOPES.join(" "));
    expect(upgradeDefaultScopes([...OLD_DEFAULTS].reverse().join("  "))).toBe(DEFAULT_SCOPES.join(" "));
  });

  it("leaves the current default and customised lists alone", () => {
    expect(upgradeDefaultScopes(DEFAULT_SCOPES.join(" "))).toBeNull();
    expect(upgradeDefaultScopes("openid conve:lock")).toBeNull();
    expect(upgradeDefaultScopes("")).toBeNull();
  });
});
