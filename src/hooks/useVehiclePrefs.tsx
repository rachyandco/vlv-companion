import { useCallback, useEffect, useState } from "react";

import {
  getVehiclePrefs,
  subscribeVehiclePrefs,
  updateVehiclePrefs,
  type VehiclePrefs,
} from "@/auth/vehiclePrefs";

type State = VehiclePrefs & {
  loading: boolean;
  setName: (next: string) => Promise<void>;
  setIsEV: (next: boolean) => Promise<void>;
};

export function useVehiclePrefs(vin: string | undefined | null): State {
  const [prefs, setPrefs] = useState<VehiclePrefs>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    if (!vin) {
      setPrefs({});
      setLoading(false);
      return;
    }
    const reload = async () => {
      const stored = await getVehiclePrefs(vin);
      if (cancelled) return;
      setPrefs(stored);
      // Reset loading inside reload itself so subscription-triggered reloads
      // also clear the spinner — not just the initial mount fetch.
      setLoading(false);
    };
    void reload();
    const unsubscribe = subscribeVehiclePrefs((changedVin) => {
      if (changedVin === vin) void reload();
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [vin]);

  // No optimistic setPrefs — updateVehiclePrefs notifies listeners
  // synchronously after the write, and our subscribeVehiclePrefs callback
  // reloads from storage. That's the single source of truth (it has the
  // trim/normalization logic), so duplicating it here would just risk drift.
  const setName = useCallback(
    async (next: string) => {
      if (!vin) return;
      await updateVehiclePrefs(vin, { name: next });
    },
    [vin],
  );

  const setIsEV = useCallback(
    async (next: boolean) => {
      if (!vin) return;
      await updateVehiclePrefs(vin, { isEV: next });
    },
    [vin],
  );

  return { ...prefs, loading, setName, setIsEV };
}
