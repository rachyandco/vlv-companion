import { skipToken, useQuery, type UseQueryResult } from "@tanstack/react-query";

import { listVehicles } from "@/api/vehicles";
import type { VehicleList } from "@/api/types";
import { useApi } from "./useApi";

export const VEHICLES_KEY = ["vehicles"] as const;

export function useVehicles(): UseQueryResult<VehicleList> {
  const api = useApi();
  return useQuery({
    queryKey: VEHICLES_KEY,
    staleTime: 60 * 60_000,
    queryFn: api ? () => listVehicles(api) : skipToken,
  });
}
