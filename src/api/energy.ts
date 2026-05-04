import type { KyInstance } from "ky";

import type { EnergyCapabilities, EnergyState } from "./types";

const PREFIX = "energy/v2";

export async function getEnergyState(api: KyInstance, vin: string): Promise<EnergyState> {
  return api.get(`${PREFIX}/vehicles/${vin}/state`).json<EnergyState>();
}

export async function getEnergyCapabilities(api: KyInstance, vin: string): Promise<EnergyCapabilities> {
  return api.get(`${PREFIX}/vehicles/${vin}/capabilities`).json<EnergyCapabilities>();
}
