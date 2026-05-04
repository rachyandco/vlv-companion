import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const HALO_MAX_OFFSET = 14; // px the halo can extend outside the gauge

type Props = {
  /** 0–100, or null when unknown. */
  percent: number | null;
  /** Optional label below the percentage (e.g. "120 km"). */
  caption?: string;
  size?: number;
  strokeWidth?: number;
  /** When true, render a gently pulsing halo around the gauge. */
  charging?: boolean;
};

export function BatteryGauge({ percent, caption, size = 180, strokeWidth = 14, charging }: Props): JSX.Element {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = percent === null ? 0 : Math.max(0, Math.min(100, percent));
  const dashOffset = circumference * (1 - clamped / 100);
  const colour = charging ? "#34d399" : colourFor(clamped);

  const outer = size + HALO_MAX_OFFSET * 2;
  const cx = outer / 2;
  const cy = outer / 2;

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!charging) return;
    pulse.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [charging, pulse]);

  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.55] });
  const haloRadius = pulse.interpolate({ inputRange: [0, 1], outputRange: [radius + 4, radius + HALO_MAX_OFFSET] });

  return (
    <View style={[styles.container, { width: outer, height: outer }]}>
      <Svg width={outer} height={outer} style={StyleSheet.absoluteFill}>
        {charging ? (
          // react-native-svg's NumberProp typing doesn't include
          // Animated.AnimatedInterpolation, but AnimatedCircle accepts it at runtime.
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={haloRadius as unknown as number}
            stroke={colour}
            strokeWidth={6}
            strokeOpacity={haloOpacity as unknown as number}
            fill="none"
          />
        ) : null}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={colour}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          fill="none"
          rotation={-90}
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      <Text style={styles.percent}>{percent === null ? "—" : `${Math.round(clamped)}%`}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

function colourFor(value: number): string {
  if (value <= 15) return "#ef4444";
  if (value <= 35) return "#f59e0b";
  return "#34d399";
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  percent: { color: "#e8eaed", fontSize: 36, fontWeight: "700" },
  caption: { color: "#bdc1c6", fontSize: 14, marginTop: 4 },
});
