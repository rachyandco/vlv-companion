/**
 * EV charging station data from OpenStreetMap via the Overpass API.
 * No key required, free, good European coverage.
 */

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

export type ChargingConnection = {
  type?: string;
  powerKw?: number;
  currentType?: string;
  quantity?: number;
};

export type ChargingStation = {
  id: string;
  longitude: number;
  latitude: number;
  name?: string;
  address?: string;
  operator?: string;
  usageType?: string;
  status?: string;
  connections?: ChargingConnection[];
};

export async function fetchChargingStations(
  latitude: number,
  longitude: number,
  radiusM = 5000,
  signal?: AbortSignal,
): Promise<ChargingStation[]> {
  const query = `[out:json][timeout:20];node["amenity"="charging_station"](around:${radiusM},${latitude},${longitude});out body;`;
  const res = await fetch(OVERPASS_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": "VlvCompanion/0.1 (degoogled-android)",
    },
    body: `data=${encodeURIComponent(query)}`,
    signal,
  });
  if (!res.ok) {
    throw new Error(`Overpass HTTP ${res.status}`);
  }
  const json = (await res.json()) as { elements?: OverpassElement[] };
  return (json.elements ?? [])
    .filter(isOverpassNode)
    .map((e) => ({
      id: `osm:${e.id}`,
      latitude: e.lat,
      longitude: e.lon,
      name: e.tags?.name,
      address: composeAddress(e.tags),
      operator: e.tags?.operator ?? e.tags?.brand,
      usageType: prettyAccess(e.tags?.access),
      connections: collectConnections(e.tags),
    }));
}

function composeAddress(tags: Record<string, string> | undefined): string | undefined {
  if (!tags) return undefined;
  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const city = [tags["addr:postcode"], tags["addr:city"]].filter(Boolean).join(" ");
  const parts = [street, city].filter((s) => s);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

function prettyAccess(value: string | undefined): string | undefined {
  if (!value) return undefined;
  switch (value.toLowerCase()) {
    case "yes":
    case "public":
      return "Public";
    case "private":
      return "Private";
    case "customers":
    case "permit":
      return "Customers only";
    default:
      return value;
  }
}

function collectConnections(tags: Record<string, string> | undefined): ChargingConnection[] | undefined {
  if (!tags) return undefined;
  const conns: ChargingConnection[] = [];
  for (const key of Object.keys(tags)) {
    if (!key.startsWith("socket:") || key.includes(":output") || key.endsWith(":voltage") || key.endsWith(":current")) {
      continue;
    }
    const value = tags[key];
    if (!value || value === "no") continue;
    const standard = key.slice("socket:".length);
    const quantity = Number.parseInt(value, 10);
    const power = parsePower(tags[`socket:${standard}:output`]);
    conns.push({
      type: prettyConnector(standard),
      powerKw: power,
      currentType: dcStandards.has(standard) ? "DC" : "AC",
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : undefined,
    });
  }
  return conns.length > 0 ? conns : undefined;
}

const dcStandards = new Set(["chademo", "ccs", "tesla_supercharger"]);

function parsePower(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const match = raw.match(/([\d.]+)\s*(k?W)/i);
  if (!match) return undefined;
  const [, valueStr, unit] = match;
  if (!valueStr || !unit) return undefined;
  const num = Number.parseFloat(valueStr);
  if (!Number.isFinite(num)) return undefined;
  return /^k/i.test(unit) ? num : num / 1000;
}

function prettyConnector(standard: string): string {
  switch (standard) {
    case "type2":
      return "Type 2";
    case "type2_combo":
      return "CCS Type 2";
    case "type1":
      return "Type 1 (J1772)";
    case "type1_combo":
      return "CCS Type 1";
    case "chademo":
      return "CHAdeMO";
    case "tesla_supercharger":
      return "Tesla Supercharger";
    case "tesla_destination":
      return "Tesla Destination";
    case "schuko":
      return "Schuko";
    default:
      return standard.replaceAll("_", " ");
  }
}

type OverpassNode = { type: "node"; id: number; lat: number; lon: number; tags?: Record<string, string> };
type OverpassElement = { type: string; id: number; lat?: number; lon?: number; tags?: Record<string, string> };

function isOverpassNode(e: OverpassElement): e is OverpassNode {
  return e.type === "node" && typeof e.lat === "number" && typeof e.lon === "number";
}
