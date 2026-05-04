import { forwardRef, useImperativeHandle, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import MapLibreGL, { type CameraRef } from "@maplibre/maplibre-react-native";

import type { ChargingStation } from "@/api/chargingStations";

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export type MapViewHandle = {
  recenter: (longitude: number, latitude: number, zoomLevel?: number) => void;
};

type Props = {
  longitude: number;
  latitude: number;
  zoom?: number;
  stations?: ChargingStation[];
  onStationPress?: (station: ChargingStation) => void;
};

export const MapView = forwardRef<MapViewHandle, Props>(function MapView(
  { longitude, latitude, zoom = 14, stations, onStationPress },
  ref,
) {
  const cameraRef = useRef<CameraRef>(null);

  useImperativeHandle(
    ref,
    () => ({
      recenter: (lng, lat, zoomLevel) => {
        cameraRef.current?.setCamera({
          centerCoordinate: [lng, lat],
          zoomLevel: zoomLevel ?? zoom,
          animationDuration: 500,
        });
      },
    }),
    [zoom],
  );

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView style={StyleSheet.absoluteFill} mapStyle={STYLE_URL} attributionEnabled>
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: [longitude, latitude], zoomLevel: zoom }}
        />

        {stations?.map((s) => (
          <MapLibreGL.PointAnnotation
            key={s.id}
            id={s.id}
            coordinate={[s.longitude, s.latitude]}
            onSelected={() => onStationPress?.(s)}
          >
            <View style={styles.stationPin}>
              <Ionicons name="flash" size={18} color="#0b3a26" />
            </View>
          </MapLibreGL.PointAnnotation>
        ))}

        <MapLibreGL.PointAnnotation id="vehicle" coordinate={[longitude, latitude]}>
          <View style={styles.pin}>
            <View style={styles.pinDot} />
          </View>
        </MapLibreGL.PointAnnotation>
      </MapLibreGL.MapView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(64,128,255,0.32)",
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4080ff",
    borderColor: "white",
    borderWidth: 2,
  },
  stationPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#34d399",
    borderColor: "white",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
