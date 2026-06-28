import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = keyof typeof Ionicons.glyphMap;

const icon = (name: IconName) => ({ color, size }: { color: string; size: number }) =>
  <Ionicons name={name} color={color} size={size} />;

export default function TabsLayout(): JSX.Element {
  // Add the bottom safe-area inset so the tab bar clears the Android system
  // navigation. With 2/3-button navigation the inset is the nav-bar height
  // (otherwise the buttons cover the tabs); with gesture navigation it is ~0,
  // leaving the bar unchanged.
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        sceneStyle: { backgroundColor: "#0b0c0f" },
        headerStyle: { backgroundColor: "#0b0c0f" },
        headerTintColor: "#e8eaed",
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#0b0c0f",
          borderTopColor: "rgba(255,255,255,0.08)",
          height: 56 + insets.bottom,
          paddingBottom: 6 + insets.bottom,
          paddingTop: 6,
        },
        tabBarItemStyle: { paddingVertical: 4, marginHorizontal: 12, borderRadius: 16 },
        tabBarActiveTintColor: "#cfe0ff",
        tabBarInactiveTintColor: "#bdc1c6",
        tabBarActiveBackgroundColor: "rgba(64,128,255,0.22)",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Garage", tabBarIcon: icon("car-sport-outline") }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: icon("settings-outline") }} />
      <Tabs.Screen name="vehicle/[vin]" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
