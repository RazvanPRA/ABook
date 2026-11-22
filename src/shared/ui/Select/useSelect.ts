import { useCallback, useMemo, useState } from 'react';
import type { SelectItem, SelectProps } from './Select.types';

type UseSelectInput<T extends string> = Pick<
  SelectProps<T>,
  'options' | 'value' | 'onChange'
>;

/**
 * Open state of a select and its rows. Choosing a row reports the value (only when it changed)
 * and closes the list. A value missing from the options shows as empty.
 */
export function useSelect<T extends string>({
  options,
  value,
  onChange,
}: UseSelectInput<T>) {
  const [open, setOpen] = useState(false);
  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);
  const items = useMemo<SelectItem<T>[]>(
    () =>
      options.map(option => ({
        ...option,
        selected: option.value === value,
        onPress: () => {
          setOpen(false);
          if (option.value !== value) {
            onChange(option.value);
          }
        },
      })),
    [options, value, onChange],
  );
  const selectedLabel = items.find(item => item.selected)?.label ?? '';
  return { open, show, hide, items, selectedLabel };
}
