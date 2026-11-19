import React from 'react';
import {
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react-native';
import { ChipGroup } from './ChipGroup';
import { useChipGroup } from './useChipGroup';

type Filter = 'all' | 'reading' | 'done';
const options = [
  { value: 'all', label: 'Toate' },
  { value: 'reading', label: 'În curs' },
  { value: 'done', label: 'Terminate' },
] as const;

describe('ChipGroup', () => {
  it('is a radiogroup with one checked radio', async () => {
    await render(
      <ChipGroup<Filter>
        options={options}
        value="reading"
        onChange={jest.fn()}
        accessibilityLabel="Filtru"
      />,
    );
    // The group stays non-accessible (TalkBack must still reach each radio), so RNTL's
    // getByRole cannot match it; check the role on the labelled container instead.
    expect(screen.getByLabelText('Filtru').props.accessibilityRole).toBe(
      'radiogroup',
    );
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'În curs' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Toate' })).not.toBeChecked();
  });

  it('calls onChange with the pressed value', async () => {
    const onChange = jest.fn();
    await render(
      <ChipGroup<Filter>
        options={options}
        value="all"
        onChange={onChange}
        accessibilityLabel="Filtru"
      />,
    );
    await fireEvent.press(screen.getByRole('radio', { name: 'Terminate' }));
    expect(onChange).toHaveBeenCalledWith('done');
  });
});

describe('useChipGroup', () => {
  it('marks the selected option and ignores a press on it', async () => {
    const onChange = jest.fn();
    const { result } = await renderHook(() =>
      useChipGroup<Filter>({ options, value: 'all', onChange }),
    );
    expect(result.current.map(i => i.selected)).toEqual([true, false, false]);
    result.current[0]?.onPress();
    expect(onChange).not.toHaveBeenCalled();
    result.current[1]?.onPress();
    expect(onChange).toHaveBeenCalledWith('reading');
  });
});
