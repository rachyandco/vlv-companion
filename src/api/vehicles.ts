import type { KyInstance } from "ky";

import type {
  CommandAccessibilityResponse,
  DiagnosticsResponse,
  DoorsResponse,
  FuelResponse,
  OdometerResponse,
  TyrePressureResponse,
  VehicleDetailsResponse,
  VehicleList,
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
