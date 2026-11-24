import React from 'react';
import { StyleSheet } from 'react-native';
import * as Reanimated from 'react-native-reanimated';
import { render, screen } from '@testing-library/react-native';
import { radius } from '@/shared/theme';
import { Skeleton } from './Skeleton';

const block = () =>
  screen.getByTestId('skeleton', { includeHiddenElements: true });

describe('Skeleton', () => {
  it('is a block of the given size, hidden from screen readers', async () => {
    await render(<Skeleton width="60%" height={20} corner="coverSm" />);
    expect(StyleSheet.flatten(block().props.style)).toMatchObject({
      width: '60%',
      height: 20,
      borderRadius: radius.coverSm,
    });
    expect(screen.queryByTestId('skeleton')).toBeNull();
  });

  it('pulses, unless the system asks for reduced motion', async () => {
    const repeat = jest.spyOn(Reanimated, 'withRepeat');
    await render(<Skeleton width={10} height={10} />);
    expect(repeat).toHaveBeenCalledTimes(1);
    jest.mocked(Reanimated.useReducedMotion).mockReturnValueOnce(true);
    await render(<Skeleton width={10} height={10} />);
    expect(repeat).toHaveBeenCalledTimes(1);
    repeat.mockRestore();
  });
});
