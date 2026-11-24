import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { size } from '@/shared/theme';
import { SearchField } from './SearchField';

function Controlled() {
  const [value, setValue] = useState('');
  return (
    <SearchField
      value={value}
      onChangeText={setValue}
      label="Caută o carte"
      clearLabel="Șterge căutarea"
    />
  );
}
const input = () => screen.getByLabelText('Caută o carte');
const clear = () => screen.queryByRole('button', { name: 'Șterge căutarea' });

describe('SearchField', () => {
  it('is a search field named by its placeholder', async () => {
    await render(<Controlled />);
    expect(input().props.accessibilityRole).toBe('search');
    expect(screen.getByPlaceholderText('Caută o carte')).toBeOnTheScreen();
    expect(clear()).toBeNull();
  });

  it('takes text and empties with a 44 pt button', async () => {
    await render(<Controlled />);
    await fireEvent.changeText(input(), 'sadoveanu');
    expect(input().props.value).toBe('sadoveanu');
    const button = screen.getByRole('button', { name: 'Șterge căutarea' });
    expect(StyleSheet.flatten(button.props.style).height).toBe(
      size.touchTarget,
    );
    await fireEvent.press(button);
    expect(input().props.value).toBe('');
    expect(clear()).toBeNull();
  });

  it('grows with the font scale', async () => {
    await render(<Controlled />);
    const style = StyleSheet.flatten(input().props.style);
    expect(style.minHeight).toBe(size.touchTarget);
    expect(style.height).toBeUndefined();
    expect(input().props.maxFontSizeMultiplier).toBeUndefined();
  });
});
