import React from 'react';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { linking, RootNavigator } from './navigation';
import { AppProviders } from './providers/AppProviders';

// DarkTheme is temporary; navigation colors come from the theme tokens in M1.
export function App() {
  return (
    <AppProviders>
      <NavigationContainer linking={linking} theme={DarkTheme}>
        <RootNavigator />
      </NavigationContainer>
    </AppProviders>
  );
}
