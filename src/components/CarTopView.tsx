import { Image, StyleSheet, View, Text } from "react-native";
import Svg, { Rect } from "react-native-svg";

import type { Doors, ResourceInstanceString } from "@/api/types";

const OPEN_STATES = new Set(["OPEN", "AJAR"]);

function isOpen(field: ResourceInstanceString | undefined): boolean | undefined {
  if (!field) return undefined;
  return OPEN_STATES.has(field.value.toUpperCase());
}

function fill(open: boolean | undefined): string {
  if (open === undefined) return "rgba(255,255,255,0)"; // unknown → invisible
  return open ? "rgba(239,68,68,0.85)" : "rgba(52,211,153,0.55)";
}

type Props = {
  doors?: Doors;
  /** Total width in px; height auto-derived from image aspect ratio. */
  width?: number;
  /** When true, hide the fuel-tank-lid indicator (no tank on a BEV). */
  isEV?: boolean;
};

const IMG = require("../../assets/volvo-top-black.png");

// Image native size: 588 × 1030 (aspect 0.5709)
const ASPECT = 1030 / 588;

export function CarTopView({ doors, width = 260, isEV }: Props): JSX.Element {
  const height = Math.round(width * ASPECT);
  const lock = doors?.centralLock?.value;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.frame, { width, height }]}>
        <Image source={IMG} style={[StyleSheet.absoluteFill, { width, height }]} resizeMode="contain" />

        {/* Door overlays positioned to match the car image. ViewBox is the
            same aspect as the image so coordinates can be expressed in % of
            588×1030. */}
        <Svg width={width} height={height} viewBox="0 0 588 1030" style={StyleSheet.absoluteFill}>
          {/* Hood */}
          <Rect x={140} y={70} width={308} height={170} rx={20} fill={fill(isOpen(doors?.hood))} />
          {/* Front-left door */}
          <Rect x={20} y={355} width={120} height={140} rx={18} fill={fill(isOpen(doors?.frontLeftDoor))} />
          {/* Front-right door */}
          <Rect x={448} y={355} width={120} height={140} rx={18} fill={fill(isOpen(doors?.frontRightDoor))} />
          {/* Rear-left door */}
          <Rect x={20} y={510} width={120} height={155} rx={18} fill={fill(isOpen(doors?.rearLeftDoor))} />
          {/* Rear-right door */}
          <Rect x={448} y={510} width={120} height={155} rx={18} fill={fill(isOpen(doors?.rearRightDoor))} />
          {/* Tank lid (left side on this car) — hidden on EVs */}
          {isEV ? null : (
            <Rect x={20} y={695} width={108} height={70} rx={10} fill={fill(isOpen(doors?.tankLid))} />
          )}
          {/* Tailgate */}
          <Rect x={130} y={830} width={328} height={140} rx={26} fill={fill(isOpen(doors?.tailgate))} />
        </Svg>
      </View>
      <Text style={styles.lock}>Central lock: {lock ?? "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", gap: 8 },
  frame: { position: "relative" },
  lock: { color: "#e8eaed", fontSize: 14 },
});
