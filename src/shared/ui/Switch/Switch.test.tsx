import React from 'react';
import { StyleSheet } from 'react-native';
import {
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react-native';
import { color, size } from '@/shared/theme';
import { Switch } from './Switch';
import { useSwitch } from './useSwitch';

const LABEL = 'Evidențiază fraza citită';
const control = () => screen.getByRole('switch', { name: LABEL });

describe('Switch', () => {
  it.each([true, false])('reports checked=%s', async value => {
    await render(
      <Switch
        value={value}
        onValueChange={jest.fn()}
        accessibilityLabel={LABEL}
      />,
    );
    if (value) {
      expect(control()).toBeChecked();
    } else {
      expect(control()).not.toBeChecked();
    }
  });

  it('paints the amber track when on', async () => {
    await render(
      <Switch value onValueChange={jest.fn()} accessibilityLabel={LABEL} />,
    );
    expect(StyleSheet.flatten(control().props.style)).toMatchObject({
      backgroundColor: color.accent,
    });
  });

  it('calls onValueChange with the opposite value', async () => {
    const onValueChange = jest.fn();
    await render(
      <Switch
        value={false}
        onValueChange={onValueChange}
        accessibilityLabel={LABEL}
      />,
    );
    await fireEvent.press(control());
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('blocks presses when disabled', async () => {
    const onValueChange = jest.fn();
    await render(
      <Switch
        value
        onValueChange={onValueChange}
        accessibilityLabel={LABEL}
        disabled
      />,
    );
    await fireEvent.press(control());
    expect(onValueChange).not.toHaveBeenCalled();
    expect(control()).toBeDisabled();
  });

  it('extends its hit area to 44 pt', async () => {
    await render(
      <Switch value onValueChange={jest.fn()} accessibilityLabel={LABEL} />,
    );
    const { hitSlop } = control().props;
    expect(size.switch.height + hitSlop.top + hitSlop.bottom).toBe(
      size.touchTarget,
    );
  });
});

describe('useSwitch', () => {
  it('toggles to the opposite value', async () => {
    const onValueChange = jest.fn();
    const { result } = await renderHook(() =>
      useSwitch({ value: true, onValueChange }),
    );
    result.current.toggle();
    expect(onValueChange).toHaveBeenCalledWith(false);
  });
});
