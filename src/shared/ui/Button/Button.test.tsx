import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { color, size } from '@/shared/theme';
import { Button } from './Button';

const button = (name: string) => screen.getByRole('button', { name });
const flat = (name: string) => StyleSheet.flatten(button(name).props.style);

describe('Button', () => {
  it.each([
    ['primary', color.accent],
    ['secondary', color.surfaceRaised],
    ['ghost', 'transparent'],
    ['danger', 'transparent'],
  ] as const)('renders the %s variant', async (variant, background) => {
    await render(
      <Button label="Salvează" onPress={jest.fn()} variant={variant} />,
    );
    expect(flat('Salvează')).toMatchObject({ backgroundColor: background });
  });

  it('keeps a 44 pt target and a 52 pt pill for lg', async () => {
    await render(
      <>
        <Button label="Mic" onPress={jest.fn()} />
        <Button label="Mare" onPress={jest.fn()} size="lg" icon="plus" />
      </>,
    );
    expect(flat('Mic').minHeight).toBe(size.touchTarget);
    expect(flat('Mare').minHeight).toBe(size.buttonLg);
  });

  it('calls onPress', async () => {
    const onPress = jest.fn();
    await render(<Button label="Importă" onPress={onPress} />);
    await fireEvent.press(button('Importă'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('blocks presses and reports the state when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Importă" onPress={onPress} disabled />);
    await fireEvent.press(button('Importă'));
    expect(onPress).not.toHaveBeenCalled();
    expect(button('Importă')).toBeDisabled();
  });

  it('shows a spinner, is busy and blocks presses while loading', async () => {
    const onPress = jest.fn();
    await render(
      <Button label="Importă" onPress={onPress} loading icon="plus" />,
    );
    await fireEvent.press(button('Importă'));
    expect(onPress).not.toHaveBeenCalled();
    expect(button('Importă')).toBeBusy();
    expect(screen.getByTestId('button-spinner')).toBeOnTheScreen();
  });
});
