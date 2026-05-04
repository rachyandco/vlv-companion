import { createContext, type ReactNode, useContext } from "react";

const VinContext = createContext<string | null>(null);

// ISO 3779: 17 chars, A–Z + 0–9, excluding I, O, Q (reserved to avoid
// confusion with 1 and 0). Rejecting bad input here stops malformed route
// params from being interpolated straight into API URLs.
const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/i;

export function isValidVin(value: unknown): value is string {
  return typeof value === "string" && VIN_RE.test(value);
}

export function VinProvider({ vin, children }: { vin: string; children: ReactNode }): JSX.Element {
  if (!isValidVin(vin)) {
    throw new Error(`VinProvider received an invalid VIN: ${JSON.stringify(vin)}`);
  }
  // VIN_RE is case-insensitive (ISO 3779 lets a–z); uppercase here so every
  // downstream consumer (storage keys, query keys, API paths) sees one form.
  return <VinContext.Provider value={vin.toUpperCase()}>{children}</VinContext.Provider>;
}

/** Returns the VIN from the surrounding [vin] route. Throws if used outside. */
export function useVin(): string {
  const vin = useContext(VinContext);
  if (!vin) throw new Error("useVin must be used inside <VinProvider>");
  return vin;
}
