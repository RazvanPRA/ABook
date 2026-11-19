import React, { type PropsWithChildren } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { color, ThemeProvider } from '@/shared/theme';
import { I18nProvider } from './I18nProvider';

/** Composition of app-wide providers. StoreProvider (M2) is added here. */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <I18nProvider>
            {/* RN 0.88 is edge-to-edge: no backgroundColor, the root view paints color.bg behind it */}
            <StatusBar barStyle="light-content" />
            {children}
          </I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
});
