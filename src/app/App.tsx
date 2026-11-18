import React, { useCallback } from 'react';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import BootSplash from 'react-native-bootsplash';
import { linking, RootNavigator } from './navigation';
import { AppProviders } from './providers/AppProviders';

// DarkTheme is temporary; navigation colors come from the theme tokens in M1.
export function App() {
  // The native splash stays up until the first screen is ready. In M2 it also waits for bootstrap.ts.
  const hideSplash = useCallback(() => {
    BootSplash.hide({ fade: true });
  }, []);

  return (
    <AppProviders>
      <NavigationContainer
        linking={linking}
        theme={DarkTheme}
        onReady={hideSplash}
      >
        <RootNavigator />
      </NavigationContainer>
    </AppProviders>
  );
}
