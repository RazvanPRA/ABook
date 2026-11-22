import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react-native';
import { color, size } from '@/shared/theme';
import { TextField } from './TextField';
import type { TextFieldProps } from './TextField.types';
import { useTextField } from './useTextField';

const input = () => screen.getByLabelText('Titlu');
const flat = () => StyleSheet.flatten(input().props.style);

function Controlled(props: Partial<TextFieldProps>) {
  const [value, setValue] = useState('Ion');
  return (
    <TextField label="Titlu" value={value} onChangeText={setValue} {...props} />
  );
}

describe('TextField', () => {
  it('shows the label and the value, and names the input by the label', async () => {
    await render(<Controlled />);
    expect(input().props.value).toBe('Ion');
    expect(
      screen.getByText('Titlu', { includeHiddenElements: true }),
    ).toBeOnTheScreen();
    // The visible label is hidden from screen readers: the input already carries it
    expect(screen.queryByText('Titlu')).toBeNull();
  });

  it('reports typed text', async () => {
    const onChangeText = jest.fn();
    await render(
      <TextField label="Titlu" value="" onChangeText={onChangeText} />,
    );
    await fireEvent.changeText(input(), 'Pădurea spânzuraților');
    expect(onChangeText).toHaveBeenCalledWith('Pădurea spânzuraților');
  });

  it('keeps typing in a controlled field', async () => {
    await render(<Controlled />);
    await fireEvent.changeText(input(), 'Ion de Rebreanu');
    expect(input().props.value).toBe('Ion de Rebreanu');
  });

  it('outlines the field in amber while focused', async () => {
    await render(<Controlled />);
    expect(flat().borderColor).toBe(color.border);
    await fireEvent(input(), 'focus');
    expect(flat().borderColor).toBe(color.accent);
    await fireEvent(input(), 'blur');
    expect(flat().borderColor).toBe(color.border);
  });

  it('shows an error under the field, as its hint, announced politely', async () => {
    await render(<Controlled error="Titlul e obligatoriu" />);
    const message = screen.getByText('Titlul e obligatoriu');
    expect(message.props.accessibilityLiveRegion).toBe('polite');
    expect(input().props.accessibilityHint).toBe('Titlul e obligatoriu');
    expect(flat().borderColor).toBe(color.danger);
  });

  it('has no hint nor message without an error', async () => {
    await render(<Controlled error={null} />);
    expect(input().props.accessibilityHint).toBeUndefined();
    expect(screen.queryByText(/obligatoriu/)).toBeNull();
  });

  it('is read-only and reported disabled when not editable', async () => {
    await render(<Controlled editable={false} />);
    expect(input().props.editable).toBe(false);
    expect(input()).toBeDisabled();
  });

  it('shows the placeholder in the muted color', async () => {
    await render(
      <TextField
        label="Titlu"
        value=""
        onChangeText={jest.fn()}
        placeholder="Titlul cărții"
      />,
    );
    expect(screen.getByPlaceholderText('Titlul cărții')).toBeOnTheScreen();
    expect(input().props.placeholderTextColor).toBe(color.textMuted);
  });

  it('grows with the font scale: no fixed height and no scaling cap', async () => {
    await render(<Controlled />);
    expect(flat().minHeight).toBe(size.input);
    expect(flat().height).toBeUndefined();
    expect(input().props.allowFontScaling).not.toBe(false);
    expect(input().props.maxFontSizeMultiplier).toBeUndefined();
  });
});

describe('useTextField', () => {
  it('tracks focus', async () => {
    const { result } = await renderHook(() => useTextField());
    expect(result.current.focused).toBe(false);
    await act(() => result.current.onFocus());
    expect(result.current.focused).toBe(true);
    await act(() => result.current.onBlur());
    expect(result.current.focused).toBe(false);
  });
});
