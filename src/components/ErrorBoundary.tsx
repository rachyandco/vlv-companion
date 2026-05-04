import { Component, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Props = { children: ReactNode };
type State = { error: Error | null };

// Minimal class-based ErrorBoundary — there's still no hooks API for this
// in React. Catches render-time throws from any descendant route so a single
// bug doesn't unmount the whole tree (the default expo-router behaviour).
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    if (__DEV__) console.error("[ErrorBoundary]", error);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error.message}</Text>
          {__DEV__ && this.state.error.stack ? (
            <Text style={styles.stack}>{this.state.error.stack}</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try again"
            onPress={this.reset}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonLabel}>Try again</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b0c0f" },
  body: { padding: 24, gap: 12 },
  title: { color: "#e8eaed", fontSize: 22, fontWeight: "700" },
  message: { color: "#fbcaca", fontSize: 14, lineHeight: 20 },
  stack: { color: "#9aa0a6", fontSize: 11, fontFamily: "monospace", lineHeight: 16 },
  button: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: "rgba(64,128,255,0.18)",
    borderColor: "rgba(64,128,255,0.5)",
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  pressed: { opacity: 0.7 },
  buttonLabel: { color: "#cfe0ff", fontWeight: "700" },
});
