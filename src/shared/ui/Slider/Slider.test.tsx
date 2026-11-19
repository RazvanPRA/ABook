import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { color } from '@/shared/theme';
import { Slider } from './Slider';

const LABEL = 'Viteză implicită';
const props = {
  label: LABEL,
  valueLabel: '1.0×',
  value: 1,
  range: { min: 0.5, max: 2, step: 0.1 },
};
const slider = () => screen.getByLabelText(LABEL);

describe('Slider', () => {
  it('shows the label and the formatted value in accent', async () => {
    await render(<Slider {...props} />);
    expect(screen.getByText(LABEL)).toBeOnTheScreen();
    expect(StyleSheet.flatten(screen.getByText('1.0×').props.style).color).toBe(
      color.accent,
    );
  });

  it('shows word values muted', async () => {
    await render(<Slider {...props} valueLabel="Normal" valueTone="muted" />);
    expect(
      StyleSheet.flatten(screen.getByText('Normal').props.style).color,
    ).toBe(color.textMuted);
  });

  it('passes value, range and token colors to the native slider', async () => {
    await render(<Slider {...props} />);
    expect(slider().props).toMatchObject({
      value: 1,
      minimumValue: 0.5,
      maximumValue: 2,
      step: 0.1,
      minimumTrackTintColor: color.accent,
      maximumTrackTintColor: color.border,
      accessibilityValue: { text: '1.0×' },
    });
  });

  it('propagates onChange while dragging and onComplete on release', async () => {
    const onChange = jest.fn();
    const onComplete = jest.fn();
    await render(
      <Slider {...props} onChange={onChange} onComplete={onComplete} />,
    );
    await fireEvent(slider(), 'valueChange', 1.3);
    await fireEvent(slider(), 'slidingComplete', 1.3);
    expect(onChange).toHaveBeenCalledWith(1.3);
    expect(onComplete).toHaveBeenCalledWith(1.3);
  });
});
