import { configureStore } from '@reduxjs/toolkit';
import { DEFAULT_SETTINGS } from '@/shared/domain';
import { settingsReducer } from '../settingsSlice';
import { changeSettings, flushSettings } from '../settingsThunks';

function setup() {
  const settingsRepository = {
    getSettings: jest.fn(async () => ({ ...DEFAULT_SETTINGS })),
    saveSettings: jest.fn(async () => {}),
  };
  const store = configureStore({
    reducer: { settings: settingsReducer },
    middleware: getDefault =>
      getDefault({ thunk: { extraArgument: { settingsRepository } } }),
  });
  return { store, save: settingsRepository.saveSettings };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('applies each change at once and writes the last one', () => {
  const { store, save } = setup();
  store.dispatch(changeSettings({ defaultRate: 1.25 }));
  jest.advanceTimersByTime(400);
  store.dispatch(changeSettings({ fontScale: 2 }));
  expect(store.getState().settings).toMatchObject({
    defaultRate: 1.25,
    fontScale: 2,
  });
  jest.advanceTimersByTime(499);
  expect(save).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(save.mock.calls).toEqual([
    [{ ...DEFAULT_SETTINGS, defaultRate: 1.25, fontScale: 2 }],
  ]);
});

it('flush writes at once, only once', async () => {
  const { store, save } = setup();
  await store.dispatch(flushSettings());
  expect(save).not.toHaveBeenCalled();
  store.dispatch(changeSettings({ defaultRate: 2 }));
  await store.dispatch(flushSettings());
  jest.advanceTimersByTime(1000);
  expect(save).toHaveBeenCalledTimes(1);
});

it('a failed write is only logged', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const { store, save } = setup();
  save.mockRejectedValueOnce(new Error('full'));
  store.dispatch(changeSettings({ defaultRate: 2 }));
  await store.dispatch(flushSettings());
  expect(warn).toHaveBeenCalledTimes(1);
  expect(store.getState().settings.defaultRate).toBe(2);
  warn.mockRestore();
});
