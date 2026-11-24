import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { size } from '@/shared/theme';
import { MenuSheet } from './MenuSheet';

async function show(visible = true) {
  const onClose = jest.fn();
  const onDelete = jest.fn();
  await render(
    <MenuSheet
      visible={visible}
      title="Opțiuni"
      closeLabel="Închide"
      onClose={onClose}
      items={[
        {
          key: 'delete',
          label: 'Șterge',
          icon: 'trash',
          tone: 'danger',
          onPress: onDelete,
        },
        { key: 'other', label: 'Altceva', onPress: jest.fn() },
      ]}
    />,
  );
  return { onClose, onDelete };
}

const row = (name: string) => screen.getByRole('menuitem', { name });

describe('MenuSheet', () => {
  it('lists its items as 44 pt menu rows', async () => {
    await show();
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    expect(StyleSheet.flatten(row('Șterge').props.style).minHeight).toBe(
      size.touchTarget,
    );
  });

  it('closes, then runs the chosen action', async () => {
    const { onClose, onDelete } = await show();
    await fireEvent.press(row('Șterge'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('closes from the backdrop without an action', async () => {
    const { onClose, onDelete } = await show();
    await fireEvent.press(screen.getByRole('button', { name: 'Închide' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('renders nothing while hidden', async () => {
    await show(false);
    expect(screen.queryByRole('menuitem')).toBeNull();
  });
});
