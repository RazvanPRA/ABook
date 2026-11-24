import React from 'react';
import { Linking } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import type { BootSnapshot } from '@/repositories';
import type { BookId } from '@/shared/domain';
import { BOOK_IDS, makeMeta } from '@/shared/domain/__fixtures__/books';
import { App } from '../App';
import { fakeServices, withBoot } from '../__fixtures__/fakeServices';

const ID = BOOK_IDS[0] as BookId;
const LINK = `abook://book/${ID}`;

/** `Linking` whose listeners the test can call. */
function mockLinking(initial: string | null) {
  const listeners = new Set<(event: { url: string }) => void>();
  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(initial);
  jest.spyOn(Linking, 'addEventListener').mockImplementation((_type, fn) => {
    listeners.add(fn);
    return { remove: () => listeners.delete(fn) } as never;
  });
  return {
    listeners,
    send: (url: string) => [...listeners].forEach(fn => fn({ url })),
  };
}

/** The app with one book, held in bootstrap until `finish`. */
async function renderBooting() {
  const { services } = fakeServices();
  await services.bookRepository.createBook(makeMeta(ID));
  const snapshot = await services.bootRepository.loadSnapshot();
  let finish: (value: BootSnapshot) => void = () => {};
  const slow = withBoot(services, {
    loadSnapshot: () =>
      new Promise<BootSnapshot>(resolve => {
        finish = resolve;
      }),
  });
  await render(<App services={slow} />);
  return () => act(async () => finish(snapshot));
}

afterEach(() => jest.restoreAllMocks());

describe('deep links', () => {
  it('opens a link that arrives during the bootstrap', async () => {
    const link = mockLinking(null);
    const finish = await renderBooting();
    link.send(LINK);
    await finish();
    expect(await screen.findByTestId('screen-book')).toBeOnTheScreen();
    expect(screen.getAllByText(makeMeta(ID).title).length).toBeGreaterThan(0);
  });

  it('prefers it to the link the app was started with', async () => {
    const link = mockLinking('abook://settings');
    const finish = await renderBooting();
    link.send('abook://library');
    link.send(LINK);
    await finish();
    expect(await screen.findByTestId('screen-book')).toBeOnTheScreen();
  });

  it('opens the link of a cold start', async () => {
    mockLinking(LINK);
    const finish = await renderBooting();
    await finish();
    expect(await screen.findByTestId('screen-book')).toBeOnTheScreen();
  });

  it('shows the missing state for a malformed id', async () => {
    mockLinking('abook://book/nu-e-un-id');
    const finish = await renderBooting();
    await finish();
    expect(await screen.findByText('Cartea nu mai există')).toBeOnTheScreen();
  });

  it('leaves later links to the navigator alone', async () => {
    const link = mockLinking(null);
    const finish = await renderBooting();
    const before = link.listeners.size;
    await finish();
    await screen.findByTestId('screen-library');
    expect(link.listeners.size).toBe(before); // ours gone, the navigator's there
    await act(async () => link.send(LINK));
    expect(await screen.findByTestId('screen-book')).toBeOnTheScreen();
  });
});
