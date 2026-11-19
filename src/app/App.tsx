import React, { useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import BootSplash from 'react-native-bootsplash';
import { linking, navigationTheme, RootNavigator } from './navigation';
import { AppProviders } from './providers/AppProviders';

export function App() {
  // The native splash stays up until the first screen is ready. In M2 it also waits for bootstrap.ts.
  const hideSplash = useCallback(() => {
    BootSplash.hide({ fade: true });
  }, []);

  return (
    <AppProviders>
      <NavigationContainer
        linking={linking}
        theme={navigationTheme}
        onReady={hideSplash}
      >
        <RootNavigator />
      </NavigationContainer>
    </AppProviders>
  );
}
