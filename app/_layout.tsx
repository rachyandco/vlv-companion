import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Stack, useSegments, useRouter } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { createQueryClient } from "@/lib/queryClient";

const queryClient = createQueryClient();

export default function RootLayout(): JSX.Element {
  // QueryClientProvider must wrap AuthProvider so signOut can drop cached
  // queries via useQueryClient (otherwise stale data survives a re-sign-in).
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" />
          <AuthRouter />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function AuthRouter(): JSX.Element {
  const { state } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "loading") return;
    const inAuthGroup = segments[0] === "(auth)";
    if (state.status === "signed-out" && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (state.status === "signed-in" && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [router, segments, state.status]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: "#0b0c0f" },
        headerTintColor: "#e8eaed",
        contentStyle: { backgroundColor: "#0b0c0f" },
      }}
    />
  );
}
