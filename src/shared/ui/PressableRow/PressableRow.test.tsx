import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PressableRow } from './PressableRow';

describe('PressableRow', () => {
  it('is one button named by its label, its parts hidden', async () => {
    const onPress = jest.fn();
    await render(
      <PressableRow label="Partea I, ascultat" onPress={onPress}>
        <Text>Partea I</Text>
      </PressableRow>,
    );
    expect(screen.queryByText('Partea I')).toBeNull();
    expect(
      screen.getByText('Partea I', { includeHiddenElements: true }),
    ).toBeOnTheScreen();
    const row = screen.getByRole('button', { name: 'Partea I, ascultat' });
    expect(row).not.toBeSelected();
    await fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('can be the selected one', async () => {
    await render(
      <PressableRow label="Partea a II-a" onPress={jest.fn()} selected>
        <Text>Partea a II-a</Text>
      </PressableRow>,
    );
    expect(screen.getByRole('button')).toBeSelected();
  });
});
