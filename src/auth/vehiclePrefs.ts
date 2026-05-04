import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "volvo.vehicleNames.v1";

export type VehiclePrefs = {
  name?: string;
  isEV?: boolean;
};

type Stored = Record<string, VehiclePrefs | string>;

async function readRaw(): Promise<Stored> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Stored;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function normalize(value: VehiclePrefs | string | undefined): VehiclePrefs {
  if (!value) return {};
  if (typeof value === "string") return { name: value };
  return value;
}

// VINs are case-insensitive per ISO 3779; Volvo's API echoes uppercase, but
// users could paste lowercase or a route param could be encoded oddly.
// Normalise everywhere so reads/writes for "yv1…" and "YV1…" don't collide.
function normalizeVin(vin: string): string {
  return vin.toUpperCase();
}

export async function getVehiclePrefs(vin: string): Promise<VehiclePrefs> {
  const all = await readRaw();
  return normalize(all[normalizeVin(vin)]);
}

// JS is single-threaded but our writes are async — two callers that interleave
// `await readRaw()` -> `await setItem(...)` would clobber each other's edits.
// Chain every update through a serial promise so the read-modify-write window
// is atomic relative to other updates.
let writeChain: Promise<unknown> = Promise.resolve();

export function updateVehiclePrefs(vin: string, patch: VehiclePrefs): Promise<void> {
  const key = normalizeVin(vin);
  const next = writeChain.then(async () => {
    const all = await readRaw();
    const current = normalize(all[key]);
    const merged: VehiclePrefs = {
      name: patch.name !== undefined ? (patch.name.trim() || undefined) : current.name,
      isEV: patch.isEV !== undefined ? patch.isEV : current.isEV,
    };
    if (!merged.name && merged.isEV === undefined) {
      delete all[key];
    } else {
      all[key] = merged;
    }
    await AsyncStorage.setItem(KEY, JSON.stringify(all));
    for (const listener of listeners) listener(key);
  });
  // Don't break the chain on a failed write — the caller still sees the rejection.
  writeChain = next.catch(() => undefined);
  return next;
}

type Listener = (vin: string) => void;
const listeners = new Set<Listener>();

/** Subscribe to vehicle-prefs writes. Returns an unsubscribe fn. */
export function subscribeVehiclePrefs(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
