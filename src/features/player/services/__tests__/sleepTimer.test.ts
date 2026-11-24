import {
  isSleepDue,
  SLEEP_OFF,
  sleepMinutesLeft,
  startSleepTimer,
} from '../sleepTimer';

const NOW = 1_000_000;
const MINUTE = 60_000;

it.each([15, 30] as const)('%d minutes end at the clock', minutes => {
  const timer = startSleepTimer(minutes, NOW);
  const due = (after: number) =>
    isSleepDue(timer, { now: NOW + after, endsChapter: true });
  expect(due(minutes * MINUTE - 1)).toBe(false);
  expect(due(minutes * MINUTE)).toBe(true);
});

it('the end of the chapter ignores the clock', () => {
  const timer = startSleepTimer('chapter', NOW);
  expect(isSleepDue(timer, { now: Infinity, endsChapter: false })).toBe(false);
  expect(isSleepDue(timer, { now: NOW, endsChapter: true })).toBe(true);
});

it('off is never due', () => {
  const timer = startSleepTimer('off', NOW);
  expect(timer).toBe(SLEEP_OFF);
  expect(isSleepDue(timer, { now: Infinity, endsChapter: true })).toBe(false);
});

it('counts the minutes left, at least one', () => {
  const timer = startSleepTimer(15, NOW);
  expect(sleepMinutesLeft(timer, NOW)).toBe(15);
  expect(sleepMinutesLeft(timer, NOW + 1)).toBe(15);
  expect(sleepMinutesLeft(timer, NOW + 14.5 * MINUTE)).toBe(1);
  expect(sleepMinutesLeft(timer, NOW + 20 * MINUTE)).toBe(1);
  expect(sleepMinutesLeft(SLEEP_OFF, NOW)).toBeNull();
});
