import { toSentenceIndex, type BookId, type Progress } from '@/shared/domain';
import { BOOK_IDS } from '@/shared/domain/__fixtures__/books';
import { makeProgress } from '@/shared/domain/__fixtures__/progress';
import { createProgressWriter, THROTTLE_MS } from '../progressWriter';

const [A, B] = BOOK_IDS as [BookId, BookId];
const at = (sentence: number): Progress => ({
  ...makeProgress(),
  sentence: toSentenceIndex(sentence),
});

function setup() {
  const saved: [BookId, number][] = [];
  const save = jest.fn(async (id: BookId, progress: Progress) => {
    saved.push([id, progress.sentence]);
  });
  const onSaved = jest.fn();
  const writer = createProgressWriter({ save, onSaved, now: Date.now });
  return { writer, save, onSaved, saved };
}

const tick = () => jest.advanceTimersByTimeAsync(0);

let warn: jest.SpyInstance;
beforeEach(() => {
  jest.useFakeTimers();
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  warn.mockRestore();
  jest.useRealTimers();
});

it('writes the first, then the last one of each 3 s', async () => {
  const { writer, saved } = setup();
  for (let i = 0; i < 4; i += 1) {
    writer.report(A, at(i), 'soon');
    await jest.advanceTimersByTimeAsync(500);
  }
  expect(saved).toEqual([[A, 0]]);
  await jest.advanceTimersByTimeAsync(THROTTLE_MS);
  expect(saved).toEqual([
    [A, 0],
    [A, 3],
  ]);
  await jest.advanceTimersByTimeAsync(THROTTLE_MS * 2);
  expect(saved).toHaveLength(2);
});

it('catches up at the next sentence when the timer never fired', async () => {
  const { writer, saved } = setup();
  writer.report(A, at(0), 'soon');
  await tick();
  writer.report(A, at(1), 'soon');
  jest.setSystemTime(Date.now() + THROTTLE_MS);
  writer.report(A, at(2), 'soon');
  await tick();
  expect(saved).toEqual([
    [A, 0],
    [A, 2],
  ]);
});

it('writes at once when asked, and not again after', async () => {
  const { writer, saved } = setup();
  writer.report(A, at(0), 'soon');
  writer.report(A, at(1), 'soon');
  writer.report(A, at(2), 'now');
  await jest.advanceTimersByTimeAsync(THROTTLE_MS * 2);
  expect(saved).toEqual([
    [A, 0],
    [A, 2],
  ]);
});

it('never writes two at a time; the latest wins', async () => {
  const { writer, save, saved } = setup();
  let release = () => {};
  save.mockImplementationOnce(
    () => new Promise(resolve => (release = resolve)),
  );
  writer.report(A, at(0), 'now');
  writer.report(A, at(1), 'now');
  writer.report(A, at(2), 'now');
  await tick();
  expect(save).toHaveBeenCalledTimes(1);
  release();
  await tick();
  expect(saved).toEqual([[A, 2]]);
});

it('keeps the books apart', async () => {
  const { writer, saved } = setup();
  writer.report(A, at(1), 'soon');
  await tick();
  writer.report(A, at(2), 'soon');
  writer.report(B, at(5), 'now');
  await tick();
  expect(saved).toEqual([
    [A, 1],
    [A, 2],
    [B, 5],
  ]);
});

it('a failed write is logged and tried again at the next sentence', async () => {
  const { writer, save, onSaved, saved } = setup();
  save.mockRejectedValueOnce(new Error('full'));
  writer.report(A, at(0), 'soon');
  await tick();
  expect(warn).toHaveBeenCalledTimes(1);
  expect(onSaved).not.toHaveBeenCalled();
  writer.report(A, at(1), 'soon');
  await tick();
  expect(saved).toEqual([[A, 1]]);
  expect(onSaved).toHaveBeenCalledWith(A, at(1));
});

it('flush writes what waits', async () => {
  const { writer, saved } = setup();
  writer.report(A, at(0), 'soon');
  await tick();
  writer.report(A, at(1), 'soon');
  await writer.flush();
  await writer.flush();
  expect(saved).toEqual([
    [A, 0],
    [A, 1],
  ]);
});

it('drain forgets what waits and waits for the write in flight', async () => {
  const { writer, save, saved } = setup();
  let release = () => {};
  save.mockImplementationOnce(
    () => new Promise(resolve => (release = resolve)),
  );
  writer.report(A, at(0), 'now');
  writer.report(A, at(1), 'now');
  const done = jest.fn();
  writer.drain(A).then(done);
  await tick();
  expect(done).not.toHaveBeenCalled();
  release();
  await tick();
  expect(done).toHaveBeenCalled();
  expect(saved).toEqual([]);
  expect(writer.hasWritten(A)).toBe(true);
  expect(writer.hasWritten(B)).toBe(false);
});

it('refuses a deleted book, also from a timer already set', async () => {
  const { writer, saved } = setup();
  writer.report(A, at(0), 'soon');
  await tick();
  writer.report(A, at(1), 'soon');
  writer.refuse(A);
  await writer.drain(A);
  writer.report(A, at(2), 'now');
  await jest.advanceTimersByTimeAsync(THROTTLE_MS * 2);
  expect(writer.isRefused(A)).toBe(true);
  expect(saved).toEqual([[A, 0]]);
});
