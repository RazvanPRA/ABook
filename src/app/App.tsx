import React, { useCallback, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import BootSplash from 'react-native-bootsplash';
import {
  featureDependencies,
  getAppServices,
  type AppServices,
} from './dependencies';
import { linking, navigationTheme, RootNavigator } from './navigation';
import { AppProviders } from './providers/AppProviders';
import { createAppStore } from './store';
import { useBootstrap } from './useBootstrap';

export interface AppProps {
  /** Injected in tests; the real storage-backed services otherwise. */
  services?: AppServices;
}

export function App({ services: given }: AppProps) {
  // Both pinned on the first render: a Fast Refresh of dependencies.ts would otherwise hand the
  // PDF host a new transport while the store's extractor still uses the old one (M3 step 17)
  const [services] = useState(() => given ?? getAppServices());
  const [store] = useState(() => createAppStore(featureDependencies(services)));
  const ready = useBootstrap(services.bootRepository, store.dispatch);
  // The navigator mounts only after hydration, so onReady (and the splash hide) comes after it too
  const hideSplash = useCallback(() => {
    BootSplash.hide({ fade: true });
  }, []);

  return (
    <AppProviders store={store} services={services}>
      {ready && (
        <NavigationContainer
          linking={linking}
          theme={navigationTheme}
          onReady={hideSplash}
        >
          <RootNavigator />
        </NavigationContainer>
      )}
    </AppProviders>
  );
}
