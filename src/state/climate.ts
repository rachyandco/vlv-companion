import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { CLIMATE_DURATION_MS } from "./climateMath";

export { CLIMATE_DURATION_MS, climateRemainingMs, isClimateActive } from "./climateMath";

type ClimateMap = Record<string, number | undefined>; // vin -> startedAt epoch ms

type ClimateStore = {
  startedAt: ClimateMap;
  start: (vin: string, at?: number) => void;
  stop: (vin: string) => void;
};

// VINs are case-insensitive (ISO 3779); normalise so "yv1…" and "YV1…"
// share an entry rather than competing.
const normalizeVin = (vin: string): string => vin.toUpperCase();

export const useClimateStore = create<ClimateStore>()(
  persist(
    (set) => ({
      startedAt: {},
      start: (vin, at = Date.now()) =>
        set((s) => ({ startedAt: { ...s.startedAt, [normalizeVin(vin)]: at } })),
      stop: (vin) =>
        set((s) => {
          const key = normalizeVin(vin);
          const { [key]: _omitted, ...rest } = s.startedAt;
          return { startedAt: rest };
        }),
    }),
    {
      name: "volvo.climate.v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ startedAt: s.startedAt }),
      // Purge two failure modes on rehydrate:
      //   - Stale entries (older than one climate cycle): a startedAt from
      //     a previous session would briefly surface a "running" banner
      //     until the next 30-second tick rerenders.
      //   - Future-dated entries (startedAt > now): can happen under
      //     backward clock skew or a backup restore from a device with a
      //     different time. Without this, isClimateActive would stay true
      //     indefinitely.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const now = Date.now();
        const cutoff = now - CLIMATE_DURATION_MS;
        const fresh: ClimateMap = {};
        for (const [vin, startedAt] of Object.entries(state.startedAt)) {
          if (startedAt && startedAt > cutoff && startedAt <= now) fresh[vin] = startedAt;
        }
        state.startedAt = fresh;
      },
    },
  ),
);
