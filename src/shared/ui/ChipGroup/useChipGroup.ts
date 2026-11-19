import { useMemo } from 'react';
import type { ChipGroupProps } from './ChipGroup.types';

export interface ChipGroupItem<T extends string> {
  value: T;
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** Derives one item per option with its selected state and a stable press handler. */
export function useChipGroup<T extends string>({
  options,
  value,
  onChange,
}: Pick<
  ChipGroupProps<T>,
  'options' | 'value' | 'onChange'
>): ChipGroupItem<T>[] {
  return useMemo(
    () =>
      options.map(option => ({
        ...option,
        selected: option.value === value,
        onPress: () => {
          if (option.value !== value) {
            onChange(option.value);
          }
        },
      })),
    [options, value, onChange],
  );
}
