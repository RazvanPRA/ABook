import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { color, type } from '@/shared/theme';
import { AppText } from './AppText';

const flat = (text: string) =>
  StyleSheet.flatten(screen.getByText(text).props.style);

describe('AppText', () => {
  it('defaults to body typography in the text color', async () => {
    await render(<AppText>Salut</AppText>);
    expect(flat('Salut')).toMatchObject({
      fontFamily: type.body.fontFamily,
      fontSize: type.body.fontSize,
      color: color.text,
    });
  });

  it.each(['display', 'title', 'caption', 'overline'] as const)(
    'applies the %s variant',
    async variant => {
      await render(<AppText variant={variant}>x</AppText>);
      expect(flat('x')).toMatchObject(type[variant]);
    },
  );

  it('uses the color token and alignment', async () => {
    await render(
      <AppText color="textMuted" align="center">
        y
      </AppText>,
    );
    expect(flat('y')).toMatchObject({
      color: color.textMuted,
      textAlign: 'center',
    });
  });

  it('caps font scaling at 1.4× for headers only', async () => {
    await render(
      <>
        <AppText variant="display">D</AppText>
        <AppText variant="title">T</AppText>
        <AppText>B</AppText>
      </>,
    );
    expect(screen.getByText('D').props.maxFontSizeMultiplier).toBe(1.4);
    expect(screen.getByText('T').props.maxFontSizeMultiplier).toBe(1.4);
    expect(screen.getByText('B').props.maxFontSizeMultiplier).toBeUndefined();
  });

  it('forwards accessibility props', async () => {
    await render(
      <AppText variant="display" accessibilityRole="header">
        Setări
      </AppText>,
    );
    expect(screen.getByRole('header', { name: 'Setări' })).toBeOnTheScreen();
  });
});
