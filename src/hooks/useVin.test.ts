import { describe, expect, it } from "vitest";

import { isValidVin } from "./useVin";

describe("isValidVin", () => {
  it("accepts a valid 17-char ISO 3779 VIN", () => {
    expect(isValidVin("YV1ZZ00000Z000000")).toBe(true);
    expect(isValidVin("yv1zz00000z000000")).toBe(true);
  });

  it("rejects non-strings", () => {
    expect(isValidVin(undefined)).toBe(false);
    expect(isValidVin(null)).toBe(false);
    expect(isValidVin(17)).toBe(false);
    expect(isValidVin({})).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(isValidVin("YV1ZZ00000Z00000")).toBe(false); // 16
    expect(isValidVin("YV1ZZ00000Z0000000")).toBe(false); // 18
    expect(isValidVin("")).toBe(false);
  });

  it("rejects the disallowed letters I, O, Q", () => {
    expect(isValidVin("IV1ZZ00000Z000000")).toBe(false);
    expect(isValidVin("YV1ZZ00000O000000")).toBe(false);
    expect(isValidVin("YV1ZZ00000Q000000")).toBe(false);
  });

  it("rejects characters outside [A-HJ-NPR-Z0-9]", () => {
    expect(isValidVin("YV1ZZ00000Z00000-")).toBe(false);
    expect(isValidVin("YV1ZZ00000Z00000.")).toBe(false);
    expect(isValidVin("YV1ZZ00000Z00000 ")).toBe(false);
    expect(isValidVin("YV1ZZ/0000Z000000")).toBe(false);
  });
});
