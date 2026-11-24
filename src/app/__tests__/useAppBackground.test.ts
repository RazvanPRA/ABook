import { AppState } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { changeSettings } from '@/features/settings';
import { playbackRequested } from '@/shared/domain';
import { A, playerApp, settle } from '../__fixtures__/playerApp';
import { useAppBackground } from '../useAppBackground';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('stores the settings and the position when the app leaves the screen', async () => {
  const listen = jest.spyOn(AppState, 'addEventListener');
  const app = await playerApp({});
  await renderHook(() => useAppBackground(app.store.dispatch));
  const onChange = listen.mock.lastCall?.[1];
  app.store.dispatch(playbackRequested({ bookId: A }));
  await settle();
  app.tts.complete();
  app.store.dispatch(changeSettings({ defaultRate: 1.5 }));
  onChange?.('active');
  await settle();
  expect(await app.stored()).toMatchObject({ sentence: 0 });
  onChange?.('background');
  await settle();
  expect(await app.stored()).toMatchObject({ sentence: 1 });
  expect(
    (await app.services.settingsRepository.getSettings()).defaultRate,
  ).toBe(1.5);
  listen.mockRestore();
});
