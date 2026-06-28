import ky, { HTTPError, type KyInstance } from "ky";

import { API_BASE } from "@/auth/config";
import { getRuntimeConfig } from "@/lib/runtimeConfig";

import { readError } from "./errors";
import { newTraceparent } from "./trace";

type GetAccessToken = () => Promise<string>;
type OnUnauthorized = () => Promise<string>;

export type ApiClientDeps = {
  getAccessToken: GetAccessToken;
  /** Called once on a 401 to force-refresh the token. Returns the new bearer. */
  onUnauthorized?: OnUnauthorized;
};

export function createApiClient({ getAccessToken, onUnauthorized }: ApiClientDeps): KyInstance {
  // Use ky's built-in retry to handle 401 → refresh → re-send. ky internally
  // clones the Request before sending so the body survives a retry (the raw
  // POST body would otherwise be consumed by the first fetch). Limiting to a
  // single 401 retry prevents loops if the refresh itself yields a 401.
  return ky.create({
    prefixUrl: API_BASE,
    timeout: 30_000,
    retry: onUnauthorized
      ? {
          limit: 1,
          statusCodes: [401],
          methods: ["get", "post", "put", "patch", "head", "delete"],
        }
      : 0,
    hooks: {
      beforeRequest: [
        async (request, _options, { retryCount }) => {
          const { vccApiKey } = await getRuntimeConfig();
          if (!vccApiKey) {
            throw new Error("vcc-api-key is not configured. Add it in Settings.");
          }
          // On retry the Authorization header was set by beforeRetry with
          // the freshly refreshed token. Don't overwrite it via
          // getAccessToken — under React 19 concurrent batching, state may
          // not have flushed yet and we'd retry with the stale token.
          if (retryCount === 0) {
            const accessToken = await getAccessToken();
            request.headers.set("Authorization", `Bearer ${accessToken}`);
          }
          request.headers.set("vcc-api-key", vccApiKey);
          if (!request.headers.has("Accept")) request.headers.set("Accept", "application/json");
          if (!request.headers.has("traceparent")) request.headers.set("traceparent", newTraceparent());
        },
      ],
      beforeRetry: onUnauthorized
        ? [
            async ({ request, error }) => {
              // beforeRetry only fires when retry.statusCodes matched — i.e.
              // the response was 401. Refresh and inject the new token; the
              // retry's beforeRequest sees retryCount > 0 and leaves it alone.
              if (!(error instanceof HTTPError) || error.response?.status !== 401) {
                return ky.stop;
              }
              const fresh = await onUnauthorized();
              request.headers.set("Authorization", `Bearer ${fresh}`);
              return undefined;
            },
          ]
        : [],
      beforeError: [
        async (error) => {
          const url = error.request?.url ?? "(unknown url)";
          const method = error.request?.method ?? "?";
          const status = error.response?.status ?? 0;
          // error.response is undefined for network errors (DNS failure,
          // connection reset, etc.) — readError requires a Response, so
          // skip enrichment entirely when one isn't there.
          const enriched = error.response
            ? await readError(error.response).catch(() => null)
            : null;
          if (__DEV__) {
            // Dev-only: log the full body so logcat captures Volvo's error
            // envelope while debugging. Disabled in release because bodies
            // can include access tokens, VINs, or other PII.
            const rawBody = await error.response?.clone().text().catch(() => "") ?? "";
            console.warn(
              `[api] ${method} ${url} → ${status}`,
              enriched?.message ?? error.message,
              "body:",
              rawBody.slice(0, 500),
            );
          }
          if (!enriched) return error;
          (error as Error & { status?: number; code?: string }).message = enriched.message;
          (error as Error & { status?: number; code?: string }).status = enriched.status;
          (error as Error & { status?: number; code?: string }).code = enriched.code;
          return error;
        },
      ],
    },
  });
}

export { HTTPError };
export { VolvoApiError, readError } from "./errors";
