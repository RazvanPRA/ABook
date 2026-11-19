import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { color } from '@/shared/theme';
import { BottomTabBar } from './BottomTabBar';
import type { BottomTabItem } from './BottomTabBar.types';

const items = (onPress = jest.fn()): BottomTabItem[] => [
  { key: 'a', label: 'Bibliotecă', icon: 'book', focused: true, onPress },
  { key: 'b', label: 'Ascultă', icon: 'headphones', focused: false, onPress },
  {
    key: 'c',
    label: 'Setări',
    icon: 'sliders-horizontal',
    focused: false,
    onPress,
  },
];

describe('BottomTabBar', () => {
  it('renders one tab per item with the focused one selected', async () => {
    await render(<BottomTabBar items={items()} />);
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tab', { name: 'Bibliotecă' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Setări' })).not.toBeSelected();
  });

  it('colors the active label accent and the others muted', async () => {
    await render(<BottomTabBar items={items()} />);
    const colorOf = (text: string) =>
      StyleSheet.flatten(screen.getByText(text).props.style).color;
    expect(colorOf('Bibliotecă')).toBe(color.accent);
    expect(colorOf('Ascultă')).toBe(color.textMuted);
  });

  it('calls the item onPress', async () => {
    const onPress = jest.fn();
    await render(<BottomTabBar items={items(onPress)} />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Ascultă' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
