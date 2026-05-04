import { Ionicons } from "@expo/vector-icons";
import { Tabs, useLocalSearchParams } from "expo-router";

import { useVehiclePrefs } from "@/hooks/useVehiclePrefs";
import { isValidVin, VinProvider } from "@/hooks/useVin";

type IconName = keyof typeof Ionicons.glyphMap;

const icon = (name: IconName) => ({ color, size }: { color: string; size: number }) =>
  <Ionicons name={name} color={color} size={size} />;

export default function VehicleLayout(): JSX.Element {
  // expo-router's generic on useLocalSearchParams is a hint, not a guarantee:
  // the runtime value is string | string[] | undefined. Validate before use.
  const params = useLocalSearchParams();
  const rawVin = params.vin;
  const vin = typeof rawVin === "string" ? rawVin : null;
  const { name } = useVehiclePrefs(vin);
  if (!isValidVin(vin)) {
    return <></>;
  }
  return (
    <VinProvider vin={vin}>
      <Tabs
        screenOptions={{
          headerShown: !!name,
          headerStyle: { backgroundColor: "#0b0c0f" },
          headerTintColor: "#e8eaed",
          headerTitle: name ?? "",
          sceneStyle: { backgroundColor: "#0b0c0f" },
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: "#0b0c0f",
            borderTopColor: "rgba(255,255,255,0.08)",
            height: 56,
            paddingBottom: 6,
            paddingTop: 6,
          },
          tabBarItemStyle: { paddingVertical: 4, marginHorizontal: 8, borderRadius: 16 },
          tabBarActiveTintColor: "#cfe0ff",
          tabBarInactiveTintColor: "#bdc1c6",
          tabBarActiveBackgroundColor: "rgba(64,128,255,0.22)",
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Overview", tabBarIcon: icon("speedometer-outline") }} />
        <Tabs.Screen name="energy" options={{ title: "Energy", tabBarIcon: icon("battery-charging-outline") }} />
        <Tabs.Screen name="location" options={{ title: "Location", tabBarIcon: icon("location-outline") }} />
        <Tabs.Screen name="commands" options={{ title: "Commands", tabBarIcon: icon("options-outline") }} />
      </Tabs>
    </VinProvider>
  );
}
