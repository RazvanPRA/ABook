import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import {
  createNavigationContainerRef,
  getStateFromPath,
  NavigationContainer,
} from '@react-navigation/native';
import { toBookId } from '@/shared/domain';
import { I18nProvider } from '../../providers/I18nProvider';
import { RootNavigator } from '../RootNavigator';
import { linking } from '../linking';
import type { RootStackParamList } from '../types';

async function renderNavigator() {
  const ref = createNavigationContainerRef<RootStackParamList>();
  await render(
    <I18nProvider>
      <NavigationContainer ref={ref}>
        <RootNavigator />
      </NavigationContainer>
    </I18nProvider>,
  );
  return ref;
}

describe('RootNavigator', () => {
  it('switches tabs through the custom tab bar', async () => {
    await renderNavigator();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tab', { name: 'Bibliotecă' })).toBeSelected();
    await fireEvent.press(screen.getByRole('tab', { name: 'Setări' }));
    expect(await screen.findByTestId('screen-settings')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Setări' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Bibliotecă' })).not.toBeSelected();
  });

  it('opens the Book screen with its id', async () => {
    const ref = await renderNavigator();
    await act(async () => ref.navigate('Book', { id: toBookId('book-42') }));
    expect(await screen.findByTestId('screen-book')).toBeOnTheScreen();
    expect(screen.getByText('book-42')).toBeOnTheScreen();
  });

  it('opens the dev UI catalog with every section (dev builds)', async () => {
    const ref = await renderNavigator();
    await act(async () => ref.navigate('DevUi'));
    expect(await screen.findByTestId('screen-dev-ui')).toBeOnTheScreen();
    for (const section of [
      'Tipografie și iconițe',
      'Butoane',
      'Chips, comutatoare, glisoare',
      'Coperți, progres, rânduri',
      'Header-e și stare goală',
    ]) {
      expect(screen.getByRole('header', { name: section })).toBeOnTheScreen();
    }
    await fireEvent.press(screen.getByRole('button', { name: 'Redă' }));
    expect(screen.getByRole('button', { name: 'Pauză' })).toBeOnTheScreen();
  });

  it('opens Import as a screen of the root stack', async () => {
    const ref = await renderNavigator();
    await act(async () => ref.navigate('Import'));
    expect(await screen.findByTestId('screen-import')).toBeOnTheScreen();
  });
});

describe('linking', () => {
  const route = (path: string) =>
    getStateFromPath(path, linking.config)?.routes[0];

  it('maps book/:id to the Book screen', () => {
    expect(route('book/abc')).toMatchObject({
      name: 'Book',
      params: { id: 'abc' },
    });
  });

  it('maps dev/ui to the catalog in dev builds', () => {
    expect(route('dev/ui')).toMatchObject({ name: 'DevUi' });
  });

  it('maps tab paths into the Tabs navigator', () => {
    expect(route('settings')?.state?.routes[0]).toMatchObject({
      name: 'Settings',
    });
  });
});
