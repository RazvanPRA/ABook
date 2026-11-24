import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { size } from '@/shared/theme';
import { Fab } from './Fab';

describe('Fab', () => {
  it('is a button named by its label, at least 44 pt, pressed once', async () => {
    const onPress = jest.fn();
    await render(<Fab label="Importă PDF" icon="plus" onPress={onPress} />);
    const fab = screen.getByRole('button', { name: 'Importă PDF' });
    const style = StyleSheet.flatten(fab.props.style);
    expect(style.minHeight).toBeGreaterThanOrEqual(size.touchTarget);
    expect(style.position).toBe('absolute');
    await fireEvent.press(fab);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('caps its font scale, so it does not cover the list', async () => {
    await render(<Fab label="Importă PDF" icon="plus" onPress={jest.fn()} />);
    expect(screen.getByText('Importă PDF').props.maxFontSizeMultiplier).toBe(
      size.maxFontScaleHeader,
    );
  });
});
