import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { color, radius, space } from '@/shared/theme';
import { Card } from './Card';

const flat = () => StyleSheet.flatten(screen.getByTestId('card').props.style);

describe('Card', () => {
  it('renders its children on the surface color', async () => {
    await render(
      <Card testID="card">
        <Text>conținut</Text>
      </Card>,
    );
    expect(screen.getByText('conținut')).toBeOnTheScreen();
    expect(flat()).toMatchObject({
      backgroundColor: color.surface,
      borderRadius: radius.cardLg,
      padding: space.lg,
    });
  });

  it('supports the raised variant without inner vertical padding', async () => {
    await render(<Card testID="card" variant="raised" padded={false} />);
    expect(flat()).toMatchObject({
      backgroundColor: color.surfaceRaised,
      paddingHorizontal: space.lg,
    });
    expect(flat().padding).toBeUndefined();
  });
});
