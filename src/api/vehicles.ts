import type { KyInstance } from "ky";

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
  VehicleList,
  WarningsResponse,
  WindowsResponse,
} from "./types";

const PREFIX = "connected-vehicle/v2";

export async function listVehicles(api: KyInstance): Promise<VehicleList> {
  return api.get(`${PREFIX}/vehicles`).json<VehicleList>();
}

export async function getVehicle(api: KyInstance, vin: string): Promise<VehicleDetailsResponse> {
  return api.get(`${PREFIX}/vehicles/${vin}`).json<VehicleDetailsResponse>();
}

export async function getDoors(api: KyInstance, vin: string): Promise<DoorsResponse> {
  return api.get(`${PREFIX}/vehicles/${vin}/doors`).json<DoorsResponse>();
}

export async function getFuel(api: KyInstance, vin: string): Promise<FuelResponse> {
  return api.get(`${PREFIX}/vehicles/${vin}/fuel`).json<FuelResponse>();
}

export async function getOdometer(api: KyInstance, vin: string): Promise<OdometerResponse> {
  return api.get(`${PREFIX}/vehicles/${vin}/odometer`).json<OdometerResponse>();
}

export async function getTyres(api: KyInstance, vin: string): Promise<TyrePressureResponse> {
  return api.get(`${PREFIX}/vehicles/${vin}/tyres`).json<TyrePressureResponse>();
}

export async function getDiagnostics(api: KyInstance, vin: string): Promise<DiagnosticsResponse> {
  return api.get(`${PREFIX}/vehicles/${vin}/diagnostics`).json<DiagnosticsResponse>();
}

export async function getCommandAccessibility(
  api: KyInstance,
  vin: string,
): Promise<CommandAccessibilityResponse> {
  return api.get(`${PREFIX}/vehicles/${vin}/command-accessibility`).json<CommandAccessibilityResponse>();
}

export async function getWindows(api: KyInstance, vin: string): Promise<WindowsResponse> {
  return api.get(`${PREFIX}/vehicles/${vin}/windows`).json<WindowsResponse>();
}

export async function getWarnings(api: KyInstance, vin: string): Promise<WarningsResponse> {
  return api.get(`${PREFIX}/vehicles/${vin}/warnings`).json<WarningsResponse>();
}

export async function getStatistics(api: KyInstance, vin: string): Promise<StatisticsResponse> {
  return api.get(`${PREFIX}/vehicles/${vin}/statistics`).json<StatisticsResponse>();
}

export async function getEngineDiagnostics(
  api: KyInstance,
  vin: string,
): Promise<EngineDiagnosticsResponse> {
  return api.get(`${PREFIX}/vehicles/${vin}/engine`).json<EngineDiagnosticsResponse>();
}

export async function getEngineStatus(api: KyInstance, vin: string): Promise<EngineStatusResponse> {
  return api.get(`${PREFIX}/vehicles/${vin}/engine-status`).json<EngineStatusResponse>();
}

export async function getBrakes(api: KyInstance, vin: string): Promise<BrakesResponse> {
  return api.get(`${PREFIX}/vehicles/${vin}/brakes`).json<BrakesResponse>();
}

export async function listCommands(api: KyInstance, vin: string): Promise<CommandListResponse> {
  return api.get(`${PREFIX}/vehicles/${vin}/commands`).json<CommandListResponse>();
}
