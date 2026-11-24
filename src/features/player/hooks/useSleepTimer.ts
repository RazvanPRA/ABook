import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { romanianPlural } from '@/shared/utils';
import {
  SLEEP_MINUTES,
  sleepMinutesLeft,
  type SleepOption,
} from '../services/sleepTimer';
import { selectSession } from '../state/selectors';

/** How often the minutes left are counted again, on screen only. */
const REFRESH_MS = 15_000;

/** What sleeps: the option that is on, its short name on the button and its spoken one. */
export function useSleepTimer() {
  const { t } = useTranslation();
  const { sleep } = useSelector(selectSession);
  const [now, setNow] = useState(Date.now);
  const counts = sleep.type === 'duration';
  useEffect(() => {
    setNow(Date.now());
    const timer = counts
      ? setInterval(() => setNow(Date.now()), REFRESH_MS)
      : undefined;
    return () => clearInterval(timer);
  }, [counts, sleep]);

  const nameOf = (option: SleepOption): string => {
    if (option === 'off') {
      return t('player.options.sleepOff');
    }
    return option === 'chapter'
      ? t('player.options.sleepChapter')
      : t(`player.options.sleepMinutes.${romanianPlural(option)}`, {
          count: option,
        });
  };
  const left = sleepMinutesLeft(sleep, now);
  const selected: SleepOption =
    sleep.type === 'duration' ? sleep.minutes : sleep.type;
  const short =
    left === null
      ? t(
          sleep.type === 'chapter'
            ? 'player.options.sleepChapterShort'
            : 'player.options.sleep',
        )
      : t('player.options.sleepShort', { count: left });
  return {
    selected,
    short,
    spoken:
      left === null
        ? nameOf(selected)
        : t(`player.options.sleepMinutes.${romanianPlural(left)}`, {
            count: left,
          }),
    options: (['off', ...SLEEP_MINUTES, 'chapter'] as const).map(value => ({
      value,
      label: nameOf(value),
    })),
  };
}
