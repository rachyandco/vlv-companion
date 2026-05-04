import type { KyInstance } from "ky";

import type { LocationResponse } from "./types";

export type ParsedLocation = {
  longitude: number;
  latitude: number;
  altitude?: number;
  properties?: Record<string, string>;
};

export async function getLocation(api: KyInstance, vin: string): Promise<LocationResponse> {
  const response = await api.get(`location/v1/vehicles/${vin}/location`).json<LocationResponse>();
  if (__DEV__) console.log("[location] raw:", JSON.stringify(response));
  return response;
}

export function parseLocation(response: LocationResponse): ParsedLocation | null {
  const coords = response.data?.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const [lng, lat, alt] = coords;
  if (typeof lng !== "number" || typeof lat !== "number") return null;
  // Volvo fills the third coordinate with `0` when no real altitude is available;
  // treat 0 as "unknown" rather than "sea level" so the UI can hide it.
  return {
    longitude: lng,
    latitude: lat,
    altitude: typeof alt === "number" && alt !== 0 ? alt : undefined,
    properties: response.data?.properties,
  };
}
