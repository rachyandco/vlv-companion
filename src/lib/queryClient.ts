import { QueryClient } from "@tanstack/react-query";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // ky's afterResponse already handles 401 (force-refresh + retry once),
        // so a TQ-level retry on 401/403 just wastes another round-trip after
        // the refresh failed. Skip retry on auth errors; keep one retry for
        // transient 5xx / network glitches.
        retry: (failureCount, error: unknown) => {
          const status = (error as { status?: number } | null)?.status;
          if (status === 401 || status === 403) return false;
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        staleTime: 30_000,
        gcTime: 30 * 60_000,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
