import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { App } from '../App';

test('opens on the Library tab with the three Romanian tab labels', async () => {
  await render(<App />);
  expect(await screen.findByTestId('screen-library')).toBeOnTheScreen();
  for (const label of ['Bibliotecă', 'Ascultă', 'Setări']) {
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  }
});
