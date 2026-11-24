export const SLEEP_MINUTES = [15, 30] as const;
export type SleepMinutes = (typeof SLEEP_MINUTES)[number];

/** What the user picks. */
export type SleepOption = SleepMinutes | 'chapter' | 'off';

/** `endsAt`: epoch milliseconds, compared at the end of each sentence (JS timers stop in background). */
export type SleepTimer =
  | { readonly type: 'off' }
  | { readonly type: 'chapter' }
  | {
      readonly type: 'duration';
      readonly minutes: SleepMinutes;
      readonly endsAt: number;
    };

export const SLEEP_OFF: SleepTimer = { type: 'off' };

const MINUTE_MS = 60_000;

export function startSleepTimer(option: SleepOption, now: number): SleepTimer {
  if (option === 'off') {
    return SLEEP_OFF;
  }
  return option === 'chapter'
    ? { type: 'chapter' }
    : {
        type: 'duration',
        minutes: option,
        endsAt: now + option * MINUTE_MS,
      };
}

/** Whether playback stops at the end of this sentence. */
export function isSleepDue(
  timer: SleepTimer,
  { now, endsChapter }: { now: number; endsChapter: boolean },
): boolean {
  switch (timer.type) {
    case 'duration':
      return now >= timer.endsAt;
    case 'chapter':
      return endsChapter;
    default:
      return false;
  }
}

/** Whole minutes left, at least one while it runs; `null` for the other kinds. */
export function sleepMinutesLeft(
  timer: SleepTimer,
  now: number,
): number | null {
  return timer.type === 'duration'
    ? Math.max(1, Math.ceil((timer.endsAt - now) / MINUTE_MS))
    : null;
}
