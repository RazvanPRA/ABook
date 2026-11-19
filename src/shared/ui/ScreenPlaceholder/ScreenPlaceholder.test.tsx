import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ScreenPlaceholder } from './ScreenPlaceholder';

describe('ScreenPlaceholder', () => {
  it('renders the title as a header', async () => {
    await render(<ScreenPlaceholder title="Setări" />);
    expect(screen.getByRole('header', { name: 'Setări' })).toBeOnTheScreen();
  });

  it('renders the detail only when given', async () => {
    await render(<ScreenPlaceholder title="Carte" detail="abc" />);
    expect(screen.getByText('abc')).toBeOnTheScreen();
  });
});
