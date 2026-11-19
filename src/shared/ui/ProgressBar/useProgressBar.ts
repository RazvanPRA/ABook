import { useMemo } from 'react';
import type { DimensionValue } from 'react-native';
import { clamp } from '@/shared/utils';

/** Clamped percentage for accessibility plus the fill width, memoized per value. */
export function useProgressBar(value: number) {
  return useMemo(() => {
    const percent = Math.round(clamp(value, 0, 1) * 100);
    const width: DimensionValue = `${percent}%`;
    return { percent, fillWidth: { width } };
  }, [value]);
}
