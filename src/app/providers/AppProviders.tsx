import React, { type PropsWithChildren } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { color, ThemeProvider } from '@/shared/theme';
import type { AppStore } from '../store';
import { I18nProvider } from './I18nProvider';
import { StoreProvider } from './StoreProvider';

/** Composition of app-wide providers: state outside, UI context inside. */
export function AppProviders({
  store,
  children,
}: PropsWithChildren<{ store: AppStore }>) {
  return (
    <StoreProvider store={store}>
      <UiProviders>{children}</UiProviders>
    </StoreProvider>
  );
}

function UiProviders({ children }: PropsWithChildren) {
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
