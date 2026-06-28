import { describe, expect, it } from "vitest";

import { classifyQueryError, SessionExpiredError } from "./sessionError";

describe("classifyQueryError", () => {
  it("flags a tagged SessionExpiredError as a session failure", () => {
    expect(classifyQueryError(new SessionExpiredError())).toBe("session");
  });

  it("flags a 401 (expired/invalid token) as a session failure", () => {
    expect(classifyQueryError(Object.assign(new Error("HTTP 401"), { status: 401 }))).toBe("session");
  });

  it("treats a 403 as a displayable api error, not a session failure", () => {
    // A 403 is 'authenticated but not authorized' — a scope/permission/region
    // restriction (e.g. Volvo's "Client not allowed to access Location API" or
    // an out-of-market vehicle). Forcing a reconnect can't fix it and would
    // pointlessly log the user out, so it must be shown, not treated as expiry.
    expect(classifyQueryError(Object.assign(new Error("HTTP 403 — Client not allowed to access Location API"), { status: 403 }))).toBe("api");
  });

  it("flags OAuth refresh failures by message", () => {
    expect(classifyQueryError(new Error("invalid_grant: refresh token expired"))).toBe("session");
    expect(classifyQueryError(new Error("No refresh token available; please sign in again."))).toBe("session");
    expect(classifyQueryError(new Error("Not signed in."))).toBe("session");
  });

  it("treats an unexpected token-pipeline TypeError as a session failure", () => {
    // The exact crash seen on the Garage screen: a fault inside the auth/token
    // pipeline that produced no HTTP response and no recognizable OAuth error.
    expect(classifyQueryError(new TypeError("Cannot read property 'status' of undefined"))).toBe("session");
  });

  it("treats network drop-outs and timeouts as transient (no forced logout)", () => {
    expect(classifyQueryError(new Error("Network request failed"))).toBe("transient");
    expect(classifyQueryError(Object.assign(new Error("Request timed out"), { name: "TimeoutError" }))).toBe(
      "transient",
    );
  });

  it("treats a well-formed Volvo API error (4xx/5xx with a body) as a displayable api error", () => {
    expect(classifyQueryError(Object.assign(new Error("HTTP 404 — not found"), { status: 404 }))).toBe("api");
    expect(classifyQueryError(Object.assign(new Error("HTTP 500 — server error"), { status: 500 }))).toBe("api");
  });

  it("does not force a logout on a null/absent error", () => {
    expect(classifyQueryError(null)).toBe("transient");
    expect(classifyQueryError(undefined)).toBe("transient");
  });
});

describe("SessionExpiredError", () => {
  it("carries a default actionable message and a stable name", () => {
    const err = new SessionExpiredError();
    expect(err.name).toBe("SessionExpiredError");
    expect(err.message.length).toBeGreaterThan(0);
    expect(err).toBeInstanceOf(Error);
  });

  it("preserves the underlying cause", () => {
    const cause = new TypeError("Cannot read property 'status' of undefined");
    const err = new SessionExpiredError("Your session expired.", { cause });
    expect((err as Error & { cause?: unknown }).cause).toBe(cause);
  });
});
