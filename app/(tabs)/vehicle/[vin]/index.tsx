import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { renderResource } from "@/components/ResourceValue";
import { StatusTile } from "@/components/StatusTile";
import { CarTopView } from "@/components/CarTopView";
import { LockTile } from "@/components/LockTile";
import { TyreStatus } from "@/components/TyreStatus";
import {
  useCommandAccessibility,
  useDiagnostics,
  useBrakes,
  useDoors,
  useEngineDiagnostics,
  useEngineStatus,
  useFuel,
  useOdometer,
  useStatistics,
  useTyres,
  useVehicle,
  useWarnings,
  useWindows,
} from "@/hooks/useVehicle";
import { engineLabel } from "@/lib/engine";
import { activeWarnings, describeWarning, hasAnyOk } from "@/lib/warnings";
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
  const windows = useWindows(vin);
  const engineStatus = useEngineStatus(vin);
  const engineDiag = useEngineDiagnostics(vin);
  const brakes = useBrakes(vin);
  const warnings = useWarnings(vin);
  const statistics = useStatistics(vin);

  const refreshing =
    vehicle.isRefetching ||
    odometer.isRefetching ||
    doors.isRefetching ||
    fuel.isRefetching ||
    energy.isRefetching ||
    diagnostics.isRefetching ||
    tyres.isRefetching ||
    windows.isRefetching ||
    engineStatus.isRefetching ||
    engineDiag.isRefetching ||
    brakes.isRefetching ||
    warnings.isRefetching ||
    statistics.isRefetching;

  const refetchAll = () => {
    void vehicle.refetch();
    void odometer.refetch();
    void doors.refetch();
    void fuel.refetch();
    void energy.refetch();
    void access.refetch();
    void diagnostics.refetch();
    void tyres.refetch();
    void windows.refetch();
    void engineStatus.refetch();
    void engineDiag.refetch();
    void brakes.refetch();
    void warnings.refetch();
    void statistics.refetch();
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
  const engineText = engineLabel(engineStatus.data?.data.engineStatus);
  const stats = statistics.data?.data;
  const healthTiles = [
    { label: "Oil level", field: engineDiag.data?.data.oilLevelWarning },
    { label: "Coolant level", field: engineDiag.data?.data.engineCoolantLevelWarning },
    { label: "Brake fluid", field: brakes.data?.data.brakeFluidLevelWarning },
  ];
  const levelColor = (level: "ok" | "warn" | "unknown") =>
    level === "ok" ? "#86efac" : level === "warn" ? "#fbe2b3" : undefined;
  const warningList = activeWarnings(warnings.data?.data);

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
          {engineText && !isEV ? `  ·  ${engineText}` : ""}
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

      <CarTopView doors={doors.data?.data} windows={windows.data?.data} isEV={isEV} />

      <TyreStatus tyres={tyres.data?.data} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health</Text>
        <View style={styles.grid}>
          {healthTiles.map(({ label, field }) => {
            const d = describeWarning(field);
            return <StatusTile key={label} label={label} value={d.text} valueColor={levelColor(d.level)} />;
          })}
          {warningList.map((w) => (
            <StatusTile key={w.key} label={w.label} value={w.text} valueColor="#fbe2b3" />
          ))}
          {warnings.isSuccess && warningList.length === 0 ? (
            hasAnyOk(warnings.data?.data) ? (
              <StatusTile label="Lights" value="No warnings" valueColor="#86efac" />
            ) : (
              <StatusTile label="Lights" value="—" />
            )
          ) : null}
        </View>
      </View>

      {stats ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip</Text>
          <View style={styles.grid}>
            <StatusTile label="Trip meter 1" value={renderResource(stats.tripMeter1)} />
            <StatusTile label="Trip meter 2" value={renderResource(stats.tripMeter2)} />
            <StatusTile label="Average speed" value={renderResource(stats.averageSpeed)} />
            {isEV ? null : (
              <StatusTile label="Fuel consumption" value={renderResource(stats.averageFuelConsumption)} />
            )}
            <StatusTile label="Distance to empty" value={renderResource(stats.distanceToEmpty)} />
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { gap: 4 },
  headerTitle: { color: "#e8eaed", fontSize: 22, fontWeight: "700" },
  headerSub: { color: "#bdc1c6", fontSize: 14 },
  section: { gap: 8 },
  sectionTitle: {
    color: "#bdc1c6",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
});
