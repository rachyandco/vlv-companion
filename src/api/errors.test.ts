import { describe, expect, it } from "vitest";

import { readError, regionRestrictionHint } from "./errors";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("readError", () => {
  it("parses the Connected Vehicle flat { code, message, details } shape", async () => {
    // The shape behind the raw-JSON dump on the Energy tab under a US VPN exit.
    const err = await readError(
      jsonResponse(404, {
        code: "VEHICLE_NOT_FOUND",
        message: "Vehicle does not belong to allowed markets",
        details: [],
      }),
    );
    expect(err.status).toBe(404);
    expect(err.code).toBe("VEHICLE_NOT_FOUND");
    expect(err.message).toBe("HTTP 404 — Vehicle does not belong to allowed markets");
  });

  it("parses the enveloped { error: { message, description } } shape", async () => {
    const err = await readError(
      jsonResponse(403, {
        error: { message: "FORBIDDEN", description: "Client not allowed to access Location API" },
      }),
    );
    expect(err.status).toBe(403);
    expect(err.message).toBe("HTTP 403 — Client not allowed to access Location API");
  });

  it("falls back to the raw body when no recognizable error shape is present", async () => {
    const err = await readError(new Response("upstream exploded", { status: 502 }));
    expect(err.status).toBe(502);
    expect(err.message).toContain("HTTP 502");
    expect(err.message).toContain("upstream exploded");
  });

  it("uses a bare status line when the body is empty", async () => {
    const err = await readError(new Response("", { status: 500 }));
    expect(err.message).toBe("HTTP 500");
  });
});

describe("regionRestrictionHint", () => {
  it("hints on an out-of-market vehicle (404 VEHICLE_NOT_FOUND)", async () => {
    const err = await readError(
      jsonResponse(404, { code: "VEHICLE_NOT_FOUND", message: "Vehicle does not belong to allowed markets" }),
    );
    expect(regionRestrictionHint(err)).toMatch(/regional restriction/i);
  });

  it("hints on the geo-gated Location API (403)", async () => {
    const err = await readError(
      jsonResponse(403, { error: { message: "FORBIDDEN", description: "Client not allowed to access Location API" } }),
    );
    expect(regionRestrictionHint(err)).toMatch(/regional restriction/i);
  });

  it("does not hint on ordinary errors", async () => {
    expect(regionRestrictionHint(await readError(new Response("", { status: 500 })))).toBeNull();
    expect(regionRestrictionHint(new Error("Network request failed"))).toBeNull();
    expect(regionRestrictionHint(null)).toBeNull();
  });
});
