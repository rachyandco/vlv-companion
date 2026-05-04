import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { renderResource } from "@/components/ResourceValue";
import { StatusTile } from "@/components/StatusTile";
import { CarTopView } from "@/components/CarTopView";
import { LockTile } from "@/components/LockTile";
import { TyreStatus } from "@/components/TyreStatus";
import {
  useCommandAccessibility,
  useDiagnostics,
  useDoors,
  useFuel,
  useOdometer,
  useTyres,
  useVehicle,
} from "@/hooks/useVehicle";
import { useEnergyState } from "@/hooks/useEnergy";
import { useVehiclePrefs } from "@/hooks/useVehiclePrefs";
import { useVin } from "@/hooks/useVin";

export default function OverviewScreen(): JSX.Element {
  const vin = useVin();
  const { isEV } = useVehiclePrefs(vin);
  const vehicle = useVehicle(vin);
  const odometer = useOdometer(vin);
  const doors = useDoors(vin);
  const fuel = useFuel(vin);
  const energy = useEnergyState(vin);
  const access = useCommandAccessibility(vin);
  const diagnostics = useDiagnostics(vin);
  const tyres = useTyres(vin);

  const refreshing =
    vehicle.isRefetching ||
    odometer.isRefetching ||
    doors.isRefetching ||
    fuel.isRefetching ||
    energy.isRefetching ||
    diagnostics.isRefetching ||
    tyres.isRefetching;

  const refetchAll = () => {
    void vehicle.refetch();
    void odometer.refetch();
    void doors.refetch();
    void fuel.refetch();
    void energy.refetch();
    void access.refetch();
    void diagnostics.refetch();
    void tyres.refetch();
  };

  if (vehicle.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#e8eaed" />
      </View>
    );
  }

  const v = vehicle.data?.data;
  const lockField = doors.data?.data.centralLock;
  const fuelField = fuel.data?.data.fuelAmount;
  const odoField = odometer.data?.data.odometer;
  const socField = energy.data?.batteryChargeLevel;
  const rangeField = energy.data?.electricRange;
  const reachable = access.data?.data.availabilityStatus?.value;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetchAll} tintColor="#e8eaed" />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {v ? `${v.modelYear} ${v.descriptions?.model ?? v.fuelType}` : "Vehicle"}
        </Text>
        <Text style={styles.headerSub}>
          {v ? `${v.externalColour ?? ""} · ${v.gearbox ?? ""}` : ""}
          {reachable ? `  ·  ${reachable}` : ""}
        </Text>
      </View>

      <LockTile vin={vin} centralLock={lockField} />

      <View style={styles.grid}>
        <StatusTile label="Battery" value={renderResource(socField, "—", (val) => `${Math.round(Number(val))}%`)} />
        <StatusTile label="Range" value={renderResource(rangeField)} />
        <StatusTile label="Odometer" value={renderResource(odoField)} />
        {isEV ? null : (
          <StatusTile label="Fuel" value={renderResource(fuelField, "—", (val) => `${Number(val).toFixed(1)} L`)} />
        )}
        {diagnostics.data?.data.distanceToService ? (
          <StatusTile
            label="Service"
            value={renderResource(diagnostics.data.data.distanceToService, "—", (val) => `${val} km`)}
          />
        ) : null}
      </View>

      <CarTopView doors={doors.data?.data} isEV={isEV} />

      <TyreStatus tyres={tyres.data?.data} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { gap: 4 },
  headerTitle: { color: "#e8eaed", fontSize: 22, fontWeight: "700" },
  headerSub: { color: "#bdc1c6", fontSize: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
});
