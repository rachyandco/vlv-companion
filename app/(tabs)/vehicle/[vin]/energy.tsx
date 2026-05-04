import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { BatteryGauge } from "@/components/BatteryGauge";
import { renderResource } from "@/components/ResourceValue";
import { StatusTile } from "@/components/StatusTile";
import { useEnergyCapabilities, useEnergyState } from "@/hooks/useEnergy";
import { useVin } from "@/hooks/useVin";

export default function EnergyScreen(): JSX.Element {
  const vin = useVin();
  const state = useEnergyState(vin);
  const caps = useEnergyCapabilities(vin);

  if (state.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#e8eaed" />
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{state.error.message}</Text>
      </View>
    );
  }

  const data = state.data;
  const c = caps.data?.getEnergyState;
  const battery = data?.batteryChargeLevel;
  const range = data?.electricRange;
  const percent = battery && battery.status === "OK" ? battery.value : null;
  const rangeCaption =
    range && range.status === "OK" ? `${Math.round(range.value)} ${range.unit ?? "km"}` : undefined;
  // When the charger isn't connected, charging-specific values come back as 0
  // / IDLE / NONE. Fade those tiles to make the dashboard scannable.
  const connection = data?.chargerConnectionStatus;
  const isPluggedIn = connection?.status === "OK" && connection.value === "CONNECTED";
  const charging =
    data?.chargingStatus?.status === "OK" && data.chargingStatus.value === "CHARGING";

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={state.isRefetching}
          onRefresh={() => {
            void state.refetch();
          }}
          tintColor="#e8eaed"
        />
      }
    >
      <View style={styles.gaugeWrap}>
        <BatteryGauge percent={percent} caption={rangeCaption} charging={charging} />
      </View>
      <View style={styles.grid}>
        <StatusTile
          label="Charger"
          value={renderResource(data?.chargerConnectionStatus)}
          unsupported={c?.chargerConnectionStatus.isSupported === false}
        />
        <StatusTile
          label="Charging"
          value={renderResource(data?.chargingStatus)}
          unsupported={c?.chargingSystemStatus.isSupported === false || !isPluggedIn}
        />
        <StatusTile
          label="Charge type"
          value={renderResource(data?.chargingType)}
          unsupported={c?.chargingType.isSupported === false || !isPluggedIn}
        />
        <StatusTile
          label="Charging power"
          value={renderResource(data?.chargingPower, "—", (val) => formatWatts(Number(val)))}
          unsupported={c?.chargingPower.isSupported === false || !isPluggedIn}
        />
        <StatusTile
          label="Target SoC"
          value={renderResource(data?.targetBatteryChargeLevel, "—", (val) => `${val}%`)}
          unsupported={c?.targetBatteryChargeLevel.isSupported === false}
        />
        <StatusTile
          label="Time to target"
          value={renderResource(data?.estimatedChargingTimeToTargetBatteryChargeLevel, "—", (val) => `${val} min`)}
          unsupported={c?.estimatedChargingTimeToTargetBatteryChargeLevel.isSupported === false || !isPluggedIn}
        />
        <StatusTile
          label="Current limit"
          value={renderResource(data?.chargingCurrentLimit, "—", (val) =>
            Number(val) > 0 ? `${val} A` : "Auto",
          )}
          hint={
            data?.chargingCurrentLimit?.status === "OK" && data.chargingCurrentLimit.value === 0
              ? "no manual cap set"
              : undefined
          }
          unsupported={c?.chargingCurrentLimit.isSupported === false}
        />
      </View>
    </ScrollView>
  );
}

function formatWatts(watts: number): string {
  if (!Number.isFinite(watts) || watts <= 0) return "0 W";
  return watts >= 1000 ? `${(watts / 1000).toFixed(1)} kW` : `${watts} W`;
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  gaugeWrap: { alignItems: "center", paddingVertical: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  error: { color: "#fbcaca" },
});
