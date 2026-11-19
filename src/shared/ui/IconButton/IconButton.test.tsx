import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { color, size } from '@/shared/theme';
import { IconButton } from './IconButton';

const button = (name: string) => screen.getByRole('button', { name });

describe('IconButton', () => {
  it('is announced by its label and keeps a 44 pt target', async () => {
    await render(
      <IconButton
        icon="chevron-left"
        accessibilityLabel="Înapoi"
        onPress={jest.fn()}
      />,
    );
    expect(StyleSheet.flatten(button('Înapoi').props.style)).toMatchObject({
      width: size.touchTarget,
      height: size.touchTarget,
    });
  });

  it('renders the 76 pt filled play button', async () => {
    await render(
      <IconButton
        icon="play"
        variant="filled"
        accessibilityLabel="Redă"
        onPress={jest.fn()}
      />,
    );
    expect(StyleSheet.flatten(button('Redă').props.style)).toMatchObject({
      width: size.playButton,
      backgroundColor: color.accent,
    });
  });

  it('calls onPress and reports the active state', async () => {
    const onPress = jest.fn();
    await render(
      <IconButton
        icon="bookmark"
        accessibilityLabel="Semn de carte"
        onPress={onPress}
        active
      />,
    );
    await fireEvent.press(button('Semn de carte'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(button('Semn de carte')).toBeSelected();
  });

  it('blocks presses when disabled', async () => {
    const onPress = jest.fn();
    await render(
      <IconButton
        icon="skip-forward"
        accessibilityLabel="Pagina următoare"
        onPress={onPress}
        disabled
      />,
    );
    await fireEvent.press(button('Pagina următoare'));
    expect(onPress).not.toHaveBeenCalled();
    expect(button('Pagina următoare')).toBeDisabled();
  });
});
