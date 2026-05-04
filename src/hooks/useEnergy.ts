import { skipToken, useQuery, type UseQueryResult } from "@tanstack/react-query";

import { getEnergyCapabilities, getEnergyState } from "@/api/energy";
import type { EnergyCapabilities, EnergyState } from "@/api/types";
import { useApi } from "./useApi";

export const energyKeys = {
  state: (vin: string) => ["vehicle", vin, "energy", "state"] as const,
  capabilities: (vin: string) => ["vehicle", vin, "energy", "capabilities"] as const,
};

export function useEnergyState(vin: string): UseQueryResult<EnergyState> {
  const api = useApi();
  return useQuery({
    queryKey: energyKeys.state(vin),
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    queryFn: api && vin ? () => getEnergyState(api, vin) : skipToken,
  });
}

export function useEnergyCapabilities(vin: string): UseQueryResult<EnergyCapabilities> {
  const api = useApi();
  return useQuery({
    queryKey: energyKeys.capabilities(vin),
    staleTime: 24 * 60 * 60_000,
    queryFn: api && vin ? () => getEnergyCapabilities(api, vin) : skipToken,
  });
}
