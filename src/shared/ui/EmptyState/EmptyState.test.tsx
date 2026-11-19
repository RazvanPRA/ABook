import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EmptyState } from './EmptyState';

const base = {
  icon: 'file-headphone',
  title: 'Încă nu ai nicio carte',
  description: 'Alege un PDF de pe telefon.',
} as const;

describe('EmptyState', () => {
  it('renders the title as a header and the description', async () => {
    await render(<EmptyState {...base} />);
    expect(
      screen.getByRole('header', { name: 'Încă nu ai nicio carte' }),
    ).toBeOnTheScreen();
    expect(screen.getByText('Alege un PDF de pe telefon.')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('runs the action and shows the note', async () => {
    const onPress = jest.fn();
    await render(
      <EmptyState
        {...base}
        action={{ label: 'Importă primul PDF', onPress, icon: 'plus' }}
        note="Funcționează cu PDF-uri cu text."
      />,
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Importă primul PDF' }),
    );
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText('Funcționează cu PDF-uri cu text.'),
    ).toBeOnTheScreen();
  });
});
