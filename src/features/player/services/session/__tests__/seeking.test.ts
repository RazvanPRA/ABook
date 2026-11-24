import { position, sentenceText as s } from '../../../__fixtures__/chapters';
import {
  makeBook,
  settle,
  setupSession,
} from '../../../__fixtures__/sessionSetup';

it('ten quick taps land ten sentences on, none read twice', async () => {
  const chapters = [Array.from({ length: 30 }, () => 1)];
  const setup = setupSession({ ...chapters });
  await setup.start(makeBook(chapters));
  for (let i = 0; i < 10; i += 1) {
    setup.session.seekSentence(1);
  }
  await settle();
  expect(setup.where()).toBe('0.10');
  expect(setup.engine.speaking).toBe(s(0, 10));
  for (let i = 0; i < 10; i += 1) {
    setup.engine.lateDone(i);
  }
  expect(setup.where()).toBe('0.10');
  setup.engine.complete();
  expect(setup.engine.speaking).toBe(s(0, 11));
});

it('quick taps across a chapter that loads still count one by one', async () => {
  const setup = setupSession();
  await setup.start(makeBook(), [0, 2]);
  setup.session.seekSentence(1);
  setup.session.seekSentence(1);
  setup.session.seekSentence(1);
  expect(setup.status()).toBe('loading');
  await settle();
  expect(setup.where()).toBe('2.0');
  expect(setup.engine.speaking).toBe(s(2, 0));
});

it('a seek while loading wins over the first one', async () => {
  const setup = setupSession();
  setup.session.open(makeBook(), { at: position(0, 0), play: true });
  setup.session.seekTo(position(2, 1));
  await settle();
  expect(setup.engine.spoken).toEqual([s(2, 1)]);
});

it('the previous sentence crosses chapters and stops at the first', async () => {
  const setup = setupSession();
  await setup.start(makeBook(), [1, 0]);
  setup.session.seekSentence(-1);
  await settle();
  expect(setup.where()).toBe('0.2');
  setup.session.seekSentence(-9);
  expect(setup.where()).toBe('0.0');
  expect(setup.engine.speaking).toBe(s(0, 0));
});

it('after the last sentence there is nowhere to go', async () => {
  const setup = setupSession();
  await setup.start(makeBook(), [2, 1]);
  setup.session.seekSentence(1);
  expect(setup.engine.spoken).toHaveLength(1);
  expect(setup.status()).toBe('playing');
});

it.each([
  [2, '0.2'],
  [3, '1.0'],
  [5, '2.1'],
  [99, '2.1'],
])('page %d starts at %s', async (page, expected) => {
  const setup = setupSession();
  await setup.start();
  setup.session.seekPage(page);
  await settle();
  expect(setup.where()).toBe(expected);
});

it('quick page taps count from the page asked for', async () => {
  const setup = setupSession();
  await setup.start();
  for (const expected of [2, 3, 4]) {
    setup.session.seekPage((setup.session.snapshot().page ?? 0) + 1);
    expect(setup.session.snapshot().page).toBe(expected);
  }
  await settle();
  expect(setup.where()).toBe('2.0');
});

it('paused, it moves silently and stores the place', async () => {
  const setup = setupSession();
  await setup.start();
  setup.session.pause();
  setup.session.seekTo(position(1, 1));
  await settle();
  expect(setup.status()).toBe('paused');
  expect(setup.engine.spoken).toHaveLength(1);
  expect(setup.last()).toMatchObject({ chapter: 1, sentence: 1, page: 3 });
});

it('does nothing without a book', () => {
  const { session, status } = setupSession();
  session.seekSentence(1);
  session.seekPage(3);
  session.seekTo(position(0, 0));
  session.play();
  session.skipChapter();
  session.pause();
  session.settingsChanged();
  expect(session.text()).toBeNull();
  expect(status()).toBe('idle');
});
