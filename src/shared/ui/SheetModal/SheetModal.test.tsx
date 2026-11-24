import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SheetModal } from './SheetModal';

const show = (visible: boolean, onClose = jest.fn()) =>
  render(
    <SheetModal visible={visible} closeLabel="Închide" onClose={onClose}>
      <Text>Conținut</Text>
    </SheetModal>,
  );

describe('SheetModal', () => {
  it('shows its content only when visible', async () => {
    await show(false);
    expect(screen.queryByText('Conținut')).toBeNull();
    await show(true);
    expect(screen.getByText('Conținut')).toBeOnTheScreen();
  });

  it('closes from the backdrop', async () => {
    const onClose = jest.fn();
    await show(true, onClose);
    await fireEvent.press(screen.getByRole('button', { name: 'Închide' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
