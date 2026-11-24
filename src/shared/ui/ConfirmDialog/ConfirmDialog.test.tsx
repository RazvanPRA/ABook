import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { size } from '@/shared/theme';
import { ConfirmDialog } from './ConfirmDialog';

async function show(visible = true) {
  const confirm = jest.fn();
  const cancel = jest.fn();
  await render(
    <ConfirmDialog
      visible={visible}
      title="Ștergi cartea?"
      lines={['Se eliberează 1,2 MB.', 'Nu poate fi anulat.']}
      confirm={{ label: 'Șterge', onPress: confirm }}
      cancel={{ label: 'Renunță', onPress: cancel }}
    />,
  );
  return { confirm, cancel };
}

const button = (name: string) => screen.getAllByRole('button', { name });

describe('ConfirmDialog', () => {
  it('shows the title as a header and every line', async () => {
    await show();
    expect(
      screen.getByRole('header', { name: 'Ștergi cartea?' }),
    ).toBeOnTheScreen();
    expect(screen.getByText('Nu poate fi anulat.')).toBeOnTheScreen();
  });

  it('confirms only from its button, which is 44 pt', async () => {
    const { confirm, cancel } = await show();
    const [action] = button('Șterge');
    expect(StyleSheet.flatten(action?.props.style).minHeight).toBe(
      size.touchTarget,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Șterge' }));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(cancel).not.toHaveBeenCalled();
  });

  it('cancels from the button and from the backdrop', async () => {
    const { confirm, cancel } = await show();
    const ways = button('Renunță');
    expect(ways).toHaveLength(2);
    for (const way of ways) {
      await fireEvent.press(way);
    }
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('renders nothing while hidden', async () => {
    await show(false);
    expect(screen.queryByText('Ștergi cartea?')).toBeNull();
  });
});
