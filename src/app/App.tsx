import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Placeholder root. Providers, navigation, fonts and i18n are wired in M0 steps 5-6.
export function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.root} testID="app-root" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
