import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import {
  createNavigationContainerRef,
  getStateFromPath,
  NavigationContainer,
} from '@react-navigation/native';
import { bookUpserted, loadLibraryProgress } from '@/features/library';
import { toBookId, type BookId } from '@/shared/domain';
import { BOOK_IDS, makeMeta } from '@/shared/domain/__fixtures__/books';
import { fakeServices } from '../../__fixtures__/fakeServices';
import { featureDependencies } from '../../dependencies';
import { I18nProvider } from '../../providers/I18nProvider';
import { StoreProvider } from '../../providers/StoreProvider';
import { createAppStore } from '../../store';
import { RootNavigator } from '../RootNavigator';
import { linking } from '../linking';
import type { RootStackParamList } from '../types';

async function renderNavigator() {
  const ref = createNavigationContainerRef<RootStackParamList>();
  const store = createAppStore(featureDependencies(fakeServices().services));
  await render(
    <StoreProvider store={store}>
      <I18nProvider>
        <NavigationContainer ref={ref}>
          <RootNavigator />
        </NavigationContainer>
      </I18nProvider>
    </StoreProvider>,
  );
  return Object.assign(ref, { store });
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
    const id = BOOK_IDS[0] as BookId;
    await act(async () => {
      ref.store.dispatch(bookUpserted(makeMeta(id)));
      await ref.store.dispatch(loadLibraryProgress());
      ref.navigate('Book', { id });
    });
    expect(await screen.findByTestId('screen-book')).toBeOnTheScreen();
    expect(
      await screen.findByRole('header', { name: makeMeta(id).title }),
    ).toBeOnTheScreen();
  });

  it.each([
    ['malformed', toBookId('book-42')],
    ['unknown', BOOK_IDS[1] as BookId],
  ])('shows a %s book id as missing, with a way back', async (_case, id) => {
    const ref = await renderNavigator();
    await act(async () => ref.navigate('Book', { id }));
    expect(await screen.findByText('Cartea nu mai există')).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Înapoi la bibliotecă' }),
    );
    expect(ref.getCurrentRoute()?.name).toBe('Library');
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
      'Căutare, schelet, meniuri',
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
    await fireEvent.press(screen.getByRole('button', { name: 'Înapoi' }));
    expect(ref.getCurrentRoute()?.name).not.toBe('Import');
  });
});

describe('linking', () => {
  const route = (path: string) =>
    getStateFromPath(path, linking.config)?.routes.at(-1);

  it('puts the tabs under a root screen, so back leads to the Library', () => {
    const state = getStateFromPath('book/abc', linking.config);
    expect(state?.routes.map(r => r.name)).toEqual(['Tabs', 'Book']);
  });

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
