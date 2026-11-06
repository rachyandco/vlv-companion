import { describe, expect, it } from "vitest";
import { commandNameFromApi, supportedCommands } from "./commands";

describe("commandNameFromApi", () => {
  it("maps every documented API name to its POST path", () => {
    expect(commandNameFromApi("HONK_AND_FLASH")).toBe("honk-flash");
    expect(commandNameFromApi("LOCK_REDUCED_GUARD")).toBe("lock-reduced-guard");
    expect(commandNameFromApi("CLIMATIZATION_START")).toBe("climatization-start");
    expect(commandNameFromApi("ENGINE_STOP")).toBe("engine-stop");
  });
  it("returns null for names the app cannot send", () => {
    expect(commandNameFromApi("SEND_NAVI_POI")).toBeNull();
    expect(commandNameFromApi("")).toBeNull();
    expect(commandNameFromApi("lock")).toBeNull();
  });
});

describe("supportedCommands", () => {
  it("is empty for an undefined or empty list", () => {
    expect(supportedCommands(undefined).size).toBe(0);
    expect(supportedCommands([]).size).toBe(0);
  });
  it("collects mappable names and skips the rest", () => {
    const set = supportedCommands([{ command: "LOCK" }, { command: "SEND_NAVI_POI" }, {}]);
    expect([...set]).toEqual(["lock"]);
  });
});
