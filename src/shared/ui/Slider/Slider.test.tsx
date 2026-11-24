import React from 'react';
import { StyleSheet } from 'react-native';
import { State } from 'react-native-gesture-handler';
import {
  fireGestureHandler,
  getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { color, size } from '@/shared/theme';
import { Slider } from './Slider';
import { SliderTrack } from './SliderTrack';
import { SLIDER_PAN, SLIDER_TAP } from './useSliderGesture';

const LABEL = 'Viteză implicită';
const WIDTH = 100 + size.slider.thumb;
const props = {
  label: LABEL,
  valueLabel: '1.0×',
  value: 1,
  range: { min: 0.5, max: 2, step: 0.1 },
};
const slider = () => screen.getByLabelText(LABEL);
const layout = () =>
  fireEvent(slider(), 'layout', {
    nativeEvent: { layout: { width: WIDTH, height: 44, x: 0, y: 0 } },
  });
/** A place on the track, 0 to 1, in points. */
const at = (fraction: number) => fraction * 100 + size.slider.thumb / 2;

const pan = (...places: number[]) =>
  fireGestureHandler(getByGestureTestId(SLIDER_PAN), [
    { state: State.BEGAN, x: at(0) },
    { state: State.ACTIVE, x: at(places[0] ?? 0) },
    ...places.map(place => ({ x: at(place) })),
    { state: State.END, x: at(places[places.length - 1] ?? 0) },
  ]);

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

  it('is a 44 pt adjustable with its value', async () => {
    await render(<Slider {...props} />);
    expect(slider().props).toMatchObject({
      accessibilityRole: 'adjustable',
      accessibilityValue: { min: 0.5, max: 2, now: 1, text: '1.0×' },
    });
    expect(StyleSheet.flatten(slider().props.style).height).toBe(
      size.touchTarget,
    );
  });

  it('a drag changes while moving and completes once', async () => {
    const onChange = jest.fn();
    const onComplete = jest.fn();
    await render(
      <Slider {...props} onChange={onChange} onComplete={onComplete} />,
    );
    await layout();
    pan(0.5, 0.5, 0.8);
    expect(onChange.mock.calls).toEqual([[1.3], [1.7]]);
    expect(onComplete.mock.calls).toEqual([[1.7]]);
  });

  it('a cancelled drag goes back and completes nothing', async () => {
    const onChange = jest.fn();
    const onComplete = jest.fn();
    await render(
      <Slider {...props} onChange={onChange} onComplete={onComplete} />,
    );
    await layout();
    fireGestureHandler(getByGestureTestId(SLIDER_PAN), [
      { state: State.BEGAN, x: at(0) },
      { state: State.ACTIVE, x: at(0.8) },
      { x: at(0.8) },
      { state: State.CANCELLED, x: at(0.8) },
    ]);
    expect(onChange.mock.calls).toEqual([[1.7], [1]]);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('a tap sets the value', async () => {
    const onComplete = jest.fn();
    await render(<Slider {...props} onComplete={onComplete} />);
    await layout();
    fireGestureHandler(getByGestureTestId(SLIDER_TAP), [
      { state: State.BEGAN, x: at(1) },
      { state: State.ACTIVE, x: at(1) },
      { state: State.END, x: at(1) },
    ]);
    expect(onComplete.mock.calls).toEqual([[2]]);
  });

  it('a screen reader moves one step, not past the end', async () => {
    const onComplete = jest.fn();
    await render(<Slider {...props} value={1.9} onComplete={onComplete} />);
    const act = (actionName: string) =>
      fireEvent(slider(), 'accessibilityAction', {
        nativeEvent: { actionName },
      });
    await act('increment');
    await act('decrement');
    expect(onComplete.mock.calls).toEqual([[2], [1.8]]);
    await screen.rerender(
      <Slider {...props} value={2} onComplete={onComplete} />,
    );
    await act('increment');
    expect(onComplete).toHaveBeenCalledTimes(2);
  });
});

describe('SliderTrack', () => {
  it('disabled: says so and ignores the steps', async () => {
    const onComplete = jest.fn();
    await render(
      <SliderTrack
        accessibilityLabel={LABEL}
        valueText="Pagina 3"
        value={3}
        range={{ min: 1, max: 9, step: 1 }}
        onComplete={onComplete}
        disabled
      />,
    );
    expect(slider()).toBeDisabled();
    await fireEvent(slider(), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(onComplete).not.toHaveBeenCalled();
  });
});
