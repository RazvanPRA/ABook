import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { IconButton } from '../IconButton';
import { ScreenHeader } from './ScreenHeader';

describe('ScreenHeader', () => {
  it('large: display title capped at 1.4× plus the right action', async () => {
    const onSettings = jest.fn();
    await render(
      <ScreenHeader
        title="Biblioteca mea"
        right={
          <IconButton
            icon="settings"
            accessibilityLabel="Setări"
            onPress={onSettings}
          />
        }
      />,
    );
    const header = screen.getByRole('header', { name: 'Biblioteca mea' });
    expect(header.props.maxFontSizeMultiplier).toBe(1.4);
    await fireEvent.press(screen.getByRole('button', { name: 'Setări' }));
    expect(onSettings).toHaveBeenCalledTimes(1);
  });

  it('large: back button before the title when given', async () => {
    const onBack = jest.fn();
    await render(
      <ScreenHeader
        title="Importă PDF"
        back={{
          icon: 'chevron-left',
          accessibilityLabel: 'Înapoi',
          onPress: onBack,
        }}
      />,
    );
    expect(screen.getByRole('header', { name: 'Importă PDF' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Înapoi' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('compact: back button, overline and centered title', async () => {
    const onBack = jest.fn();
    await render(
      <ScreenHeader
        variant="compact"
        title="Amintiri din copilărie"
        overline="Partea a II-a"
        back={{
          icon: 'chevron-down',
          accessibilityLabel: 'Închide playerul',
          onPress: onBack,
        }}
      />,
    );
    const header = screen.getByRole('header', {
      name: 'Amintiri din copilărie',
    });
    expect(header.props.maxFontSizeMultiplier).toBe(1.4);
    expect(screen.getByText('Partea a II-a')).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Închide playerul' }),
    );
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('compact without back renders no button', async () => {
    await render(<ScreenHeader variant="compact" title="Carte" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
