import { skipToken, useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  getCommandAccessibility,
  getDiagnostics,
  getDoors,
  getFuel,
  getOdometer,
  getTyres,
  getVehicle,
} from "@/api/vehicles";
import type {
  CommandAccessibilityResponse,
  DiagnosticsResponse,
  DoorsResponse,
  FuelResponse,
  OdometerResponse,
  TyrePressureResponse,
  VehicleDetailsResponse,
} from "@/api/types";
import { useApi } from "./useApi";

export const vehicleKeys = {
  all: (vin: string) => ["vehicle", vin] as const,
  details: (vin: string) => [...vehicleKeys.all(vin), "details"] as const,
  doors: (vin: string) => [...vehicleKeys.all(vin), "doors"] as const,
  fuel: (vin: string) => [...vehicleKeys.all(vin), "fuel"] as const,
  odometer: (vin: string) => [...vehicleKeys.all(vin), "odometer"] as const,
  tyres: (vin: string) => [...vehicleKeys.all(vin), "tyres"] as const,
  diagnostics: (vin: string) => [...vehicleKeys.all(vin), "diagnostics"] as const,
  accessibility: (vin: string) => [...vehicleKeys.all(vin), "accessibility"] as const,
};

const ONE_HOUR = 60 * 60_000;
const HALF_MIN = 30_000;
const ONE_MIN = 60_000;

export function useVehicle(vin: string): UseQueryResult<VehicleDetailsResponse> {
  const api = useApi();
  return useQuery({
    queryKey: vehicleKeys.details(vin),
    staleTime: ONE_HOUR,
    queryFn: api && vin ? () => getVehicle(api, vin) : skipToken,
  });
}

export function useDoors(vin: string): UseQueryResult<DoorsResponse> {
  const api = useApi();
  return useQuery({
    queryKey: vehicleKeys.doors(vin),
    staleTime: HALF_MIN,
    queryFn: api && vin ? () => getDoors(api, vin) : skipToken,
  });
}

export function useFuel(vin: string): UseQueryResult<FuelResponse> {
  const api = useApi();
  return useQuery({
    queryKey: vehicleKeys.fuel(vin),
    staleTime: ONE_MIN,
    queryFn: api && vin ? () => getFuel(api, vin) : skipToken,
  });
}

export function useOdometer(vin: string): UseQueryResult<OdometerResponse> {
  const api = useApi();
  return useQuery({
    queryKey: vehicleKeys.odometer(vin),
    staleTime: 5 * ONE_MIN,
    queryFn: api && vin ? () => getOdometer(api, vin) : skipToken,
  });
}

export function useTyres(vin: string): UseQueryResult<TyrePressureResponse> {
  const api = useApi();
  return useQuery({
    queryKey: vehicleKeys.tyres(vin),
    staleTime: 5 * ONE_MIN,
    queryFn: api && vin ? () => getTyres(api, vin) : skipToken,
  });
}

export function useDiagnostics(vin: string): UseQueryResult<DiagnosticsResponse> {
  const api = useApi();
  return useQuery({
    queryKey: vehicleKeys.diagnostics(vin),
    staleTime: 5 * ONE_MIN,
    queryFn: api && vin ? () => getDiagnostics(api, vin) : skipToken,
  });
}

export function useCommandAccessibility(vin: string): UseQueryResult<CommandAccessibilityResponse> {
  const api = useApi();
  return useQuery({
    queryKey: vehicleKeys.accessibility(vin),
    staleTime: HALF_MIN,
    queryFn: api && vin ? () => getCommandAccessibility(api, vin) : skipToken,
  });
}
