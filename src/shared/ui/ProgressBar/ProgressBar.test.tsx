import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { color } from '@/shared/theme';
import { ProgressBar } from './ProgressBar';

const LABEL = 'Progres ascultare';
const bar = () => screen.getByRole('progressbar', { name: LABEL });
const fill = () =>
  StyleSheet.flatten(
    screen.getByTestId('progress-fill', { includeHiddenElements: true }).props
      .style,
  );

describe('ProgressBar', () => {
  it('exposes the value as 0–100 and draws the fill', async () => {
    await render(<ProgressBar value={0.41} accessibilityLabel={LABEL} />);
    expect(bar()).toHaveAccessibilityValue({ min: 0, max: 100, now: 41 });
    expect(fill()).toMatchObject({
      width: '41%',
      backgroundColor: color.accent,
    });
  });

  it.each([
    [-0.5, 0],
    [1.7, 100],
    [NaN, 0],
  ])('clamps %p to %p%%', async (value, now) => {
    await render(<ProgressBar value={value} accessibilityLabel={LABEL} />);
    expect(bar()).toHaveAccessibilityValue({ now });
    expect(fill().width).toBe(`${now}%`);
  });

  it.each([
    ['success', color.success],
    ['info', color.info],
  ] as const)('uses the %s tone', async (tone, expected) => {
    await render(
      <ProgressBar value={1} tone={tone} accessibilityLabel={LABEL} />,
    );
    expect(fill().backgroundColor).toBe(expected);
  });
});
