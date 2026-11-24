import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { RootNavigator, type RootStackParamList } from '../navigation';
import { I18nProvider } from '../providers/I18nProvider';
import { StoreProvider } from '../providers/StoreProvider';
import { playerApp, settle } from './playerApp';

type App = Awaited<ReturnType<typeof playerApp>>;

/** The navigator over a player app, in its first tab. */
export async function renderPlayerApp(app: App) {
  const ref = createNavigationContainerRef<RootStackParamList>();
  await render(
    <StoreProvider store={app.store}>
      <I18nProvider>
        <NavigationContainer ref={ref}>
          <RootNavigator />
        </NavigationContainer>
      </I18nProvider>
    </StoreProvider>,
  );
  /** Runs it and lets storage, the voices and the screen answer. */
  const run = (change: () => unknown) =>
    act(async () => {
      change();
      await settle();
    });
  const button = (name: string) => screen.getByRole('button', { name });
  return {
    ...app,
    run,
    button,
    openPlayer: () => run(() => ref.navigate('Tabs', { screen: 'Player' })),
    tab: () => ref.getCurrentRoute()?.name,
  };
}
