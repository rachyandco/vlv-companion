import { useEffect, useMemo, useRef } from "react";
import type { KyInstance } from "ky";

import { createApiClient } from "@/api/client";
import { useAuth } from "@/auth/AuthProvider";

export function useApi(): KyInstance | null {
  const { state, getAccessToken, forceRefreshAccessToken } = useAuth();
  // getAccessToken / forceRefreshAccessToken get a fresh reference whenever
  // tokens change. Funneling them through refs keeps the ky client stable
  // across token refreshes — otherwise every refresh creates a new client
  // (and React Query observers thrash their queryFn closures).
  const getAccessTokenRef = useRef(getAccessToken);
  const forceRefreshRef = useRef(forceRefreshAccessToken);
  useEffect(() => {
    getAccessTokenRef.current = getAccessToken;
  }, [getAccessToken]);
  useEffect(() => {
    forceRefreshRef.current = forceRefreshAccessToken;
  }, [forceRefreshAccessToken]);

  return useMemo(() => {
    if (state.status !== "signed-in") return null;
    return createApiClient({
      getAccessToken: () => getAccessTokenRef.current(),
      onUnauthorized: () => forceRefreshRef.current(),
    });
  }, [state.status]);
}
