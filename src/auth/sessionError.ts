/**
 * Tagged error meaning the session is unrecoverable and the user must
 * re-authenticate. The auth layer throws this after a failed token refresh (and
 * has already forced a sign-out by then); the UI recognises it to prompt a
 * reconnect instead of surfacing a dead error.
 */
export class SessionExpiredError extends Error {
  constructor(
    message = "Your session expired. Please sign in again.",
    options?: { cause?: unknown },
  ) {
    super(message);
    this.name = "SessionExpiredError";
    if (options?.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

export type QueryErrorKind = "session" | "transient" | "api";

/**
 * Classify an error surfaced by a data query so the UI can react correctly:
 *
 *  - "session"   → the session/token pipeline is broken; force a disconnect and
 *                  prompt the user to reconnect.
 *  - "transient" → a network drop-out or timeout; keep any cached data and let
 *                  the user retry (pull-to-refresh). Never log the user out.
 *  - "api"       → a well-formed Volvo API error (4xx/5xx with a body); show its
 *                  message.
 *
 * The important case is the fall-through: an error that produced no HTTP
 * response and isn't a recognizable network/timeout fault — e.g. a `TypeError`
 * thrown inside the token-refresh pipeline ("Cannot read property 'status' of
 * undefined"). That means the session is broken in a way the app can't display
 * usefully, so it's treated as a session failure (force reconnect) rather than
 * a dead inline error the user can't act on.
 */
export function classifyQueryError(error: unknown): QueryErrorKind {
  if (!error) return "transient";

  const err = error as Error & { status?: number; name?: string };

  if (err instanceof SessionExpiredError) return "session";

  const status = typeof err.status === "number" ? err.status : undefined;
  // Only 401 means the token is expired/invalid (reconnect fixes it). A 403 is
  // 'authenticated but not authorized' — a scope/permission/region restriction
  // (e.g. an out-of-market vehicle or the geo-gated Location API) that a
  // reconnect can't resolve, so it falls through to "api" and is displayed.
  if (status === 401) return "session";

  const message = typeof err.message === "string" ? err.message : "";
  if (/invalid[_ ]grant|refresh.?token|please sign in|not signed in/i.test(message)) {
    return "session";
  }

  // Transient: network drop-outs and request timeouts. ky raises TimeoutError;
  // React Native's fetch raises "Network request failed".
  if (err.name === "TimeoutError" || /network request failed|network error|timed out/i.test(message)) {
    return "transient";
  }

  // A well-formed Volvo API error carries a numeric HTTP status (set by
  // readError). Anything >= 400 is a real server response worth displaying.
  if (typeof status === "number" && status >= 400) return "api";

  // No status, not a known transient: the request never produced a real HTTP
  // response. Treat as a broken session so the app forces a reconnect.
  return "session";
}
