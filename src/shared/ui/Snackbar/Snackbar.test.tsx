import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { size } from '@/shared/theme';
import { Snackbar } from './Snackbar';

describe('Snackbar', () => {
  it('announces its message politely and grows with the font scale', async () => {
    await render(<Snackbar message="Semn de carte șters" />);
    const text = screen.getByText('Semn de carte șters');
    expect(text.parent?.props.accessibilityLiveRegion).toBe('polite');
    expect(text.props.maxFontSizeMultiplier).toBeUndefined();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('offers its action as a 44 pt button', async () => {
    const onPress = jest.fn();
    await render(
      <Snackbar message="Șters" action={{ label: 'Anulează', onPress }} />,
    );
    const action = screen.getByRole('button', { name: 'Anulează' });
    expect(StyleSheet.flatten(action.props.style).minHeight).toBe(
      size.touchTarget,
    );
    await fireEvent.press(action);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
