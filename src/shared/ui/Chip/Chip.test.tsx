import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { color } from '@/shared/theme';
import { Chip } from './Chip';

describe('Chip', () => {
  it('renders static metadata without a role', async () => {
    await render(<Chip label="82 pagini" />);
    expect(screen.getByText('82 pagini')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('is a selectable button when it has onPress', async () => {
    const onPress = jest.fn();
    await render(<Chip label="În curs" selected onPress={onPress} />);
    const chip = screen.getByRole('button', { name: 'În curs' });
    expect(chip).toBeSelected();
    expect(StyleSheet.flatten(chip.props.style)).toMatchObject({
      backgroundColor: color.accent,
    });
    await fireEvent.press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('reports checked when used as a radio', async () => {
    await render(
      <Chip
        label="Toate"
        selected
        onPress={jest.fn()}
        accessibilityRole="radio"
      />,
    );
    expect(screen.getByRole('radio', { name: 'Toate' })).toBeChecked();
  });

  it('extends its hit area to 44 pt', async () => {
    await render(<Chip label="Toate" onPress={jest.fn()} />);
    const { hitSlop } = screen.getByRole('button').props;
    expect(32 + hitSlop.top + hitSlop.bottom).toBe(44);
  });
});
