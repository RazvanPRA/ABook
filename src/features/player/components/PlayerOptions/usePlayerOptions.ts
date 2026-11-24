import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectSettings } from '@/features/settings';
import { FONT_SCALES } from '@/shared/domain';
import type { MenuItem } from '@/shared/ui';
import { usePlayerDispatch } from '../../hooks/usePlayerDispatch';
import { useSleepTimer } from '../../hooks/useSleepTimer';
import { formatRate, RATES } from '../../services/formatRate';
import { setFontScale, setRate, setSleep } from '../../state/thunks';

type OptionName = 'rate' | 'sleep' | 'font';

const FONTS = { 0: 'small', 1: 'medium', 2: 'large' } as const;

/** The menus behind the three buttons, and which one is open. */
export function usePlayerOptions() {
  const { t } = useTranslation();
  const dispatch = usePlayerDispatch();
  const { defaultRate, fontScale } = useSelector(selectSettings);
  const sleep = useSleepTimer();
  const [open, setOpen] = useState<OptionName | null>(null);
  const actions = useMemo(
    () => ({
      rate: () => setOpen('rate'),
      sleep: () => setOpen('sleep'),
      font: () => setOpen('font'),
      close: () => setOpen(null),
    }),
    [],
  );

  const fontName = (scale: keyof typeof FONTS) =>
    t(`player.options.fonts.${FONTS[scale]}`);
  const menus: Record<OptionName, { title: string; items: MenuItem[] }> = {
    rate: {
      title: t('player.options.rate'),
      items: RATES.map(rate => ({
        key: String(rate),
        label: formatRate(rate),
        selected: rate === defaultRate,
        onPress: () => dispatch(setRate(rate)),
      })),
    },
    sleep: {
      title: t('player.options.sleepTitle'),
      items: sleep.options.map(({ value, label }) => ({
        key: String(value),
        label,
        selected: value === sleep.selected,
        onPress: () => dispatch(setSleep(value)),
      })),
    },
    font: {
      title: t('player.options.fontTitle'),
      items: FONT_SCALES.map(scale => ({
        key: String(scale),
        label: fontName(scale),
        selected: scale === fontScale,
        onPress: () => dispatch(setFontScale(scale)),
      })),
    },
  };
  const rate = formatRate(defaultRate);
  return {
    open,
    menu: open === null ? null : menus[open],
    actions,
    rate: { label: rate, spoken: t('player.options.rateLabel', { rate }) },
    sleep: {
      label: sleep.short,
      spoken: t('player.options.sleepLabel', { value: sleep.spoken }),
      active: sleep.selected !== 'off',
    },
    font: {
      label: t('player.options.font'),
      spoken: t('player.options.fontLabel', { value: fontName(fontScale) }),
    },
  };
}
