import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectSettings } from '@/features/settings';
import { formatDuration } from '@/shared/utils';
import { selectSession } from '../state/selectors';
import { readRemainingSeconds } from '../state/thunks';
import { usePlayerDispatch } from './usePlayerDispatch';

/** "~ 1 h 52 min rămase", measured again at every sentence; `null` without a book. */
export function useRemainingTime(): string | null {
  const { t } = useTranslation();
  const dispatch = usePlayerDispatch();
  const { position, loaded } = useSelector(selectSession);
  const rate = useSelector(selectSettings).defaultRate;
  const seconds = useMemo(
    () => dispatch(readRemainingSeconds()),
    // What it depends on lives in the session, and changes with these
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, position, loaded, rate],
  );
  return seconds === null
    ? null
    : t('player.page.remaining', {
        time: formatDuration(seconds, {
          hour: t('format.duration.hour'),
          minute: t('format.duration.minute'),
          lessThanMinute: t('format.duration.lessThanMinute'),
        }),
      });
}
