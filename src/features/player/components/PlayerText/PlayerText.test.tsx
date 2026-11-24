import React from 'react';
import { StyleSheet } from 'react-native';
import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { settingsChanged, settingsReducer } from '@/features/settings';
import '@/shared/i18n';
import { color } from '@/shared/theme';
import { makeText, position, sentenceText } from '../../__fixtures__/chapters';
import { groupParagraphs } from '../../services/paragraphs';
import { IDLE } from '../../services/session';
import { playerReducer, sessionChanged } from '../../state/playerSlice';
import { PlayerText } from './PlayerText';

const mockRendered = jest.fn();
jest.mock('./SentenceSpan', () => {
  const actual = jest.requireActual('./SentenceSpan');
  return {
    SentenceSpan: jest.requireActual('react').memo((props: object) => {
      mockRendered(props);
      return actual.SentenceSpan.type(props);
    }),
  };
});

// Three paragraphs: one for each page
const CHUNK = makeText(0, [1, 1, 1, 2, 2, 3]);

async function setup() {
  const store = configureStore({
    reducer: { player: playerReducer, settings: settingsReducer },
  });
  const at = (sentence: number) =>
    store.dispatch(
      sessionChanged({
        ...IDLE,
        status: 'playing',
        loaded: true,
        position: position(0, sentence),
      }),
    );
  at(0);
  const actions = { onRead: jest.fn(), onBookmark: jest.fn() };
  await render(
    <Provider store={store}>
      <PlayerText
        text={{ chapter: 0, chunk: CHUNK, paragraphs: groupParagraphs(CHUNK) }}
        actions={actions}
      />
    </Provider>,
  );
  return { store, actions, at };
}

const styleOf = (sentence: number) =>
  StyleSheet.flatten(
    screen.getByText(sentenceText(0, sentence), { exact: true }).props.style,
  );

it('highlights the active sentence and dims those before it', async () => {
  const { at } = await setup();
  await act(async () => {
    at(1);
  });
  expect(styleOf(0)).toEqual({ color: color.textRead });
  expect(styleOf(1)).toEqual({
    color: color.text,
    backgroundColor: color.highlight,
  });
  expect(styleOf(2).color).toBe(color.textUpcoming);
  expect(styleOf(5).color).toBe(color.textUpcoming);
});

it('has no background with the highlight off', async () => {
  const { store } = await setup();
  await act(async () => {
    store.dispatch(settingsChanged({ highlightSentence: false }));
  });
  expect(styleOf(0)).toEqual({ color: color.text });
});

it('a new active sentence renders only the spans that change', async () => {
  const { at } = await setup();
  mockRendered.mockClear();
  await act(async () => {
    at(1);
  });
  expect(mockRendered).toHaveBeenCalledTimes(2);
  mockRendered.mockClear();
  await act(async () => {
    at(3);
  });
  // 1 and 2 become read, 3 becomes active; the third paragraph is left alone
  expect(mockRendered).toHaveBeenCalledTimes(3);
});

it('a tap reads from the sentence, a long press bookmarks it', async () => {
  const { actions } = await setup();
  await fireEvent.press(screen.getByText(sentenceText(0, 4)));
  expect(actions.onRead).toHaveBeenCalledWith(4);
  await fireEvent(screen.getByText(sentenceText(0, 5)), 'longPress');
  expect(actions.onBookmark).toHaveBeenCalledWith(5);
});

it('a paragraph is one element with actions for its active or first sentence', async () => {
  const { actions, at } = await setup();
  await act(async () => {
    at(1);
  });
  const paragraphs = screen.getAllByTestId('paragraph');
  const [paragraph, second] = paragraphs;
  expect(paragraphs).toHaveLength(3);
  for (const [element, name] of [
    [paragraph, 'read'],
    [second, 'bookmark'],
  ] as const) {
    if (element) {
      await fireEvent(element, 'accessibilityAction', {
        nativeEvent: { actionName: name },
      });
    }
  }
  expect(actions.onRead).toHaveBeenCalledWith(1);
  expect(actions.onBookmark).toHaveBeenCalledWith(3);
});

it('a drag suspends the scrolling and offers the way back; a tap resumes too', async () => {
  await setup();
  const back = 'Înapoi la fraza curentă';
  const drag = () =>
    fireEvent(screen.getByTestId('player-text'), 'scrollBeginDrag');
  expect(screen.queryByText(back)).toBeNull();
  await drag();
  await fireEvent.press(screen.getByRole('button', { name: back }));
  expect(screen.queryByRole('button', { name: back })).toBeNull();
  await drag();
  await fireEvent.press(screen.getByText(sentenceText(0, 1)));
  expect(screen.queryByRole('button', { name: back })).toBeNull();
});
