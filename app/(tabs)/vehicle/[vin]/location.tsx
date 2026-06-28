import { useCallback, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import type { ChargingStation } from "@/api/chargingStations";
import { regionRestrictionHint } from "@/api/errors";
import { MapView, type MapViewHandle } from "@/components/MapView";
import { useChargingStations } from "@/hooks/useChargingStations";
import { useVehicleLocation } from "@/hooks/useVehicleLocation";
import { useVin } from "@/hooks/useVin";

export default function LocationScreen(): JSX.Element {
  const vin = useVin();
  const { data, isLoading, error, refetch, isRefetching } = useVehicleLocation(vin);
  const stations = useChargingStations(data?.latitude, data?.longitude);
  const [selected, setSelected] = useState<ChargingStation | null>(null);
  const mapRef = useRef<MapViewHandle>(null);

  const openExternal = useCallback(async () => {
    if (!data) return;
    const url = `geo:${data.latitude},${data.longitude}`;
    try {
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert("No map app installed", "Install OsmAnd or Organic Maps to open this location externally.");
        return;
      }
      await Linking.openURL(url);
    } catch (err) {
      // Intent resolution can still throw on degoogled Android even when
      // canOpenURL says the scheme is reachable (e.g. the matching activity
      // disappears between the two calls). Surface the error instead of
      // letting the unhandled rejection crash the screen.
      Alert.alert(
        "Could not open maps",
        err instanceof Error ? err.message : String(err),
      );
    }
  }, [data]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#e8eaed" />
      </View>
    );
  }
  const status = (error as { status?: number } | null)?.status;
  if (error && status !== 404) {
    const hint = regionRestrictionHint(error);
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error.message}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    );
  }
  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>No location reported yet.</Text>
        <Text style={styles.hint}>
          Volvo publishes the location after the car has been driven once since pairing. Try again after your next
          drive.
        </Text>
        <Pressable
          style={[styles.action, { marginTop: 16 }]}
          onPress={() => {
            void refetch();
          }}
        >
          <Text style={styles.actionLabel}>{isRefetching ? "Refreshing…" : "Refresh"}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          longitude={data.longitude}
          latitude={data.latitude}
          stations={stations.data}
          onStationPress={(s) => {
            setSelected(s);
            mapRef.current?.recenter(s.longitude, s.latitude, 16);
          }}
        />

        {/* Floating overlay — sits on top of the map, doesn't push it. */}
        <View pointerEvents="box-none" style={styles.overlay}>
          {selected ? (
            <StationCard
              station={selected}
              carLatitude={data.latitude}
              carLongitude={data.longitude}
              onClose={() => setSelected(null)}
            />
          ) : (
            <View style={styles.coordsCard}>
              <Text style={styles.coordsCardText}>
                {stations.isLoading
                  ? "Searching for chargers nearby…"
                  : stations.data
                    ? `${stations.data.length} EV charger${stations.data.length === 1 ? "" : "s"} within 20 km`
                    : "Tap a green pin for charger info."}
              </Text>
              <View style={styles.coordsCardActions}>
                <Pressable style={styles.action} onPress={openExternal}>
                  <Text style={styles.actionLabel}>Open in maps</Text>
                </Pressable>
                <Pressable
                  style={styles.action}
                  onPress={() => {
                    void refetch();
                  }}
                >
                  <Text style={styles.actionLabel}>{isRefetching ? "…" : "Refresh"}</Text>
                </Pressable>
                <Pressable
                  style={styles.iconAction}
                  onPress={() => {
                    setSelected(null);
                    mapRef.current?.recenter(data.longitude, data.latitude);
                  }}
                  hitSlop={8}
                  accessibilityLabel="Recenter on car"
                >
                  <Ionicons name="locate-outline" size={18} color="#cfe0ff" />
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function StationCard({
  station,
  carLatitude,
  carLongitude,
  onClose,
}: {
  station: ChargingStation;
  carLatitude: number;
  carLongitude: number;
  onClose: () => void;
}): JSX.Element {
  const distanceKm = haversineKm(carLatitude, carLongitude, station.latitude, station.longitude);
  const openInMaps = () => {
    void Linking.openURL(`geo:${station.latitude},${station.longitude}`).catch(() => {});
  };

  return (
    <View style={styles.stationCard}>
      <View style={styles.stationHeader}>
        <View style={styles.stationIcon}>
          <Ionicons name="flash" size={22} color="#0b3a26" />
        </View>
        <View style={styles.stationTitleWrap}>
          <Text style={styles.stationTitle} numberOfLines={2}>
            {station.name ?? "Charging station"}
          </Text>
          {station.operator ? <Text style={styles.stationSub}>{station.operator}</Text> : null}
          {station.address ? (
            <Text style={styles.stationSub} numberOfLines={1}>
              {station.address}
            </Text>
          ) : null}
        </View>
        <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="#bdc1c6" />
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <Ionicons name="navigate-outline" size={14} color="#cfe0ff" />
          <Text style={styles.metaText}>{formatDistance(distanceKm)}</Text>
        </View>
        {station.usageType ? (
          <View style={styles.metaPill}>
            <Ionicons name="people-outline" size={14} color="#cfe0ff" />
            <Text style={styles.metaText}>{station.usageType}</Text>
          </View>
        ) : null}
        {station.status ? (
          <View
            style={[
              styles.metaPill,
              /operational/i.test(station.status) ? styles.metaOk : styles.metaWarn,
            ]}
          >
            <Text style={[styles.metaText, /operational/i.test(station.status) ? styles.metaOkText : styles.metaWarnText]}>
              {station.status}
            </Text>
          </View>
        ) : null}
      </View>

      {station.connections?.length ? (
        <View>
          <Text style={styles.sectionLabel}>Connectors</Text>
          <View style={{ gap: 6 }}>
            {station.connections.map((c, idx) => (
              <View key={`${c.type ?? "unknown"}-${idx}`} style={styles.connectorRow}>
                <Text style={styles.connectorType} numberOfLines={1}>
                  {c.type ?? "Unknown connector"}
                </Text>
                <View style={styles.connectorMeta}>
                  {typeof c.powerKw === "number" ? (
                    <Text style={styles.connectorPower}>{c.powerKw} kW</Text>
                  ) : null}
                  {c.currentType ? <Text style={styles.connectorSub}>{c.currentType}</Text> : null}
                  {c.quantity && c.quantity > 1 ? (
                    <Text style={styles.connectorSub}>×{c.quantity}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <Pressable style={styles.primaryButton} onPress={openInMaps}>
        <Ionicons name="map-outline" size={18} color="#0b0c0f" />
        <Text style={styles.primaryButtonLabel}>Open in maps</Text>
      </Pressable>
    </View>
  );
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapWrap: { flex: 1, position: "relative" },
  overlay: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
  },
  coordsCard: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(11,12,15,0.8)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    gap: 8,
  },
  coordsCardText: { color: "#e8eaed", fontSize: 13 },
  coordsCardActions: { flexDirection: "row", gap: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 6 },
  hint: { color: "#bdc1c6", fontSize: 13, lineHeight: 18, textAlign: "center" },
  muted: { color: "#bdc1c6" },
  action: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "rgba(64,128,255,0.18)",
    borderColor: "rgba(64,128,255,0.5)",
    borderWidth: 1,
  },
  actionLabel: { color: "#cfe0ff", fontWeight: "600" },
  iconAction: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(64,128,255,0.18)",
    borderColor: "rgba(64,128,255,0.5)",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  error: { color: "#fbcaca" },

  stationCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(11,12,15,0.8)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.5)",
    overflow: "hidden",
    gap: 12,
  },
  stationHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  stationIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#34d399",
  },
  stationTitleWrap: { flex: 1, gap: 2 },
  stationTitle: { color: "#e8eaed", fontSize: 16, fontWeight: "700" },
  stationSub: { color: "#bdc1c6", fontSize: 13 },
  closeBtn: { padding: 4 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(64,128,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(64,128,255,0.4)",
  },
  metaText: { color: "#cfe0ff", fontSize: 12, fontWeight: "600" },
  metaOk: { backgroundColor: "rgba(52,211,153,0.18)", borderColor: "rgba(52,211,153,0.5)" },
  metaOkText: { color: "#bcf2dd" },
  metaWarn: { backgroundColor: "rgba(245,158,11,0.18)", borderColor: "rgba(245,158,11,0.5)" },
  metaWarnText: { color: "#fbe2b3" },
  connectorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 8,
  },
  connectorType: { color: "#e8eaed", fontSize: 13, fontWeight: "600", flex: 1 },
  connectorMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  connectorPower: { color: "#34d399", fontSize: 13, fontWeight: "700" },
  connectorSub: { color: "#bdc1c6", fontSize: 12 },
  sectionLabel: {
    color: "#bdc1c6",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#34d399",
  },
  primaryButtonLabel: { color: "#0b0c0f", fontSize: 15, fontWeight: "700" },
});
