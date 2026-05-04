import { skipToken, useQuery, type UseQueryResult } from "@tanstack/react-query";

import { getLocation, parseLocation, type ParsedLocation } from "@/api/location";
import { useApi } from "./useApi";

export const locationKey = (vin: string) => ["vehicle", vin, "location"] as const;

export function useVehicleLocation(vin: string): UseQueryResult<ParsedLocation | null> {
  const api = useApi();
  return useQuery({
    queryKey: locationKey(vin),
    staleTime: 60_000,
    queryFn:
      api && vin
        ? async () => {
            const response = await getLocation(api, vin);
            return parseLocation(response);
          }
        : skipToken,
  });
}
