import { skipToken, useQuery, type UseQueryResult } from "@tanstack/react-query";

import { fetchChargingStations, type ChargingStation } from "@/api/chargingStations";

const RADIUS_M = 20_000;
/** Round centre to ~1.1 km grid so small VIN updates don't refire Overpass. */
const QUANTUM = 0.01;

function quantize(n: number): number {
  return Math.round(n / QUANTUM) * QUANTUM;
}

export function useChargingStations(
  latitude: number | undefined,
  longitude: number | undefined,
): UseQueryResult<ChargingStation[]> {
  const lat = latitude !== undefined ? quantize(latitude) : undefined;
  const lng = longitude !== undefined ? quantize(longitude) : undefined;
  return useQuery({
    // The "osm" suffix forces a fresh fetch after the OpenChargeMap detour;
    // bump again if the data source changes.
    queryKey: ["charging-stations:osm", lat, lng] as const,
    staleTime: 10 * 60_000,
    gcTime: 60 * 60_000,
    queryFn:
      lat !== undefined && lng !== undefined
        ? ({ signal }) => fetchChargingStations(lat, lng, RADIUS_M, signal)
        : skipToken,
  });
}
