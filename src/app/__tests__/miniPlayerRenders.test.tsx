import { screen } from '@testing-library/react-native';
import { playbackRequested } from '@/shared/domain';
import { A, playerApp, sentence } from '../__fixtures__/playerApp';
import { renderPlayerApp } from '../__fixtures__/renderPlayer';

const mockBar = jest.fn();
const mockList = jest.fn();
jest.mock('@/shared/ui/BottomTabBar', () => ({
  BottomTabBar: () => {
    mockBar();
    return null;
  },
}));
jest.mock('@/features/library/components/BookList', () => ({
  BookList: () => {
    mockList();
    return null;
  },
}));

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('a new sentence renders neither the tab bar nor the library', async () => {
  const app = await renderPlayerApp(await playerApp({}));
  await app.run(() => app.store.dispatch(playbackRequested({ bookId: A })));
  expect(screen.getByTestId('mini-player')).toBeOnTheScreen();
  mockBar.mockClear();
  mockList.mockClear();
  await app.run(() => app.tts.complete());
  expect(app.tts.speaking).toBe(sentence(0, 1));
  expect(mockBar).not.toHaveBeenCalled();
  expect(mockList).not.toHaveBeenCalled();
});
