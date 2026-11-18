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
  it('switches tabs', async () => {
    await renderNavigator();
    await fireEvent.press(screen.getByText('Setări'));
    expect(await screen.findByTestId('screen-settings')).toBeOnTheScreen();
  });

  it('opens the Book screen with its id', async () => {
    const ref = await renderNavigator();
    await act(async () => ref.navigate('Book', { id: toBookId('book-42') }));
    expect(await screen.findByTestId('screen-book')).toBeOnTheScreen();
    expect(screen.getByText('book-42')).toBeOnTheScreen();
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

  it('maps tab paths into the Tabs navigator', () => {
    expect(route('settings')?.state?.routes[0]).toMatchObject({
      name: 'Settings',
    });
  });
});
