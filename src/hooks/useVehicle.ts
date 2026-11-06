import { skipToken, useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  getBrakes,
  getCommandAccessibility,
  getDiagnostics,
  getDoors,
  getEngineDiagnostics,
  getEngineStatus,
  getFuel,
  getOdometer,
  getStatistics,
  getTyres,
  getVehicle,
  getWarnings,
  getWindows,
  listCommands,
} from "@/api/vehicles";
import type {
  BrakesResponse,
  CommandAccessibilityResponse,
  CommandListResponse,
  DiagnosticsResponse,
  DoorsResponse,
  EngineDiagnosticsResponse,
  EngineStatusResponse,
  FuelResponse,
  OdometerResponse,
  StatisticsResponse,
  TyrePressureResponse,
  VehicleDetailsResponse,
  WarningsResponse,
  WindowsResponse,
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
  windows: (vin: string) => [...vehicleKeys.all(vin), "windows"] as const,
  warnings: (vin: string) => [...vehicleKeys.all(vin), "warnings"] as const,
  statistics: (vin: string) => [...vehicleKeys.all(vin), "statistics"] as const,
  engine: (vin: string) => [...vehicleKeys.all(vin), "engine"] as const,
  engineStatus: (vin: string) => [...vehicleKeys.all(vin), "engineStatus"] as const,
  brakes: (vin: string) => [...vehicleKeys.all(vin), "brakes"] as const,
  commands: (vin: string) => [...vehicleKeys.all(vin), "commands"] as const,
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

export function useWindows(vin: string): UseQueryResult<WindowsResponse> {
  const api = useApi();
  return useQuery({
    queryKey: vehicleKeys.windows(vin),
    staleTime: HALF_MIN,
    queryFn: api && vin ? () => getWindows(api, vin) : skipToken,
  });
}

export function useWarnings(vin: string): UseQueryResult<WarningsResponse> {
  const api = useApi();
  return useQuery({
    queryKey: vehicleKeys.warnings(vin),
    staleTime: 5 * ONE_MIN,
    queryFn: api && vin ? () => getWarnings(api, vin) : skipToken,
  });
}

export function useStatistics(vin: string): UseQueryResult<StatisticsResponse> {
  const api = useApi();
  return useQuery({
    queryKey: vehicleKeys.statistics(vin),
    staleTime: 5 * ONE_MIN,
    queryFn: api && vin ? () => getStatistics(api, vin) : skipToken,
  });
}

export function useEngineDiagnostics(vin: string): UseQueryResult<EngineDiagnosticsResponse> {
  const api = useApi();
  return useQuery({
    queryKey: vehicleKeys.engine(vin),
    staleTime: 5 * ONE_MIN,
    queryFn: api && vin ? () => getEngineDiagnostics(api, vin) : skipToken,
  });
}

export function useEngineStatus(vin: string): UseQueryResult<EngineStatusResponse> {
  const api = useApi();
  return useQuery({
    queryKey: vehicleKeys.engineStatus(vin),
    staleTime: HALF_MIN,
    queryFn: api && vin ? () => getEngineStatus(api, vin) : skipToken,
  });
}

export function useBrakes(vin: string): UseQueryResult<BrakesResponse> {
  const api = useApi();
  return useQuery({
    queryKey: vehicleKeys.brakes(vin),
    staleTime: 5 * ONE_MIN,
    queryFn: api && vin ? () => getBrakes(api, vin) : skipToken,
  });
}

export function useCommandList(vin: string): UseQueryResult<CommandListResponse> {
  const api = useApi();
  return useQuery({
    queryKey: vehicleKeys.commands(vin),
    staleTime: 24 * ONE_HOUR,
    queryFn: api && vin ? () => listCommands(api, vin) : skipToken,
  });
}
