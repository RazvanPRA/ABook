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
import { Select } from './Select';
import type { SelectOption } from './Select.types';
import { useSelect } from './useSelect';

type Lang = 'ro-RO' | 'en-US';
const OPTIONS: readonly SelectOption<Lang>[] = [
  { value: 'ro-RO', label: 'Română (ro-RO)' },
  { value: 'en-US', label: 'Engleză (en-US)' },
];

const field = () => screen.getByRole('combobox', { name: 'Limba vocii' });
const option = (name: string) => screen.getByRole('radio', { name });

function Controlled({ onChange }: { onChange?: (value: Lang) => void }) {
  const [value, setValue] = useState<Lang>('ro-RO');
  return (
    <Select<Lang>
      label="Limba vocii"
      options={OPTIONS}
      value={value}
      onChange={next => {
        setValue(next);
        onChange?.(next);
      }}
      closeLabel="Închide"
    />
  );
}

describe('Select', () => {
  it('shows the chosen option as the combobox value, collapsed', async () => {
    await render(<Controlled />);
    expect(screen.getByText('Română (ro-RO)')).toBeOnTheScreen();
    expect(field().props.accessibilityValue).toEqual({
      text: 'Română (ro-RO)',
    });
    expect(field()).toBeCollapsed();
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('opens a list with one radio per option, the chosen one checked', async () => {
    await render(<Controlled />);
    await fireEvent.press(field());
    expect(field()).toBeExpanded();
    expect(option('Română (ro-RO)')).toBeChecked();
    expect(option('Engleză (en-US)')).not.toBeChecked();
    // A radiogroup container is not accessible itself (M1): look it up by label
    const groups = screen
      .getAllByLabelText('Limba vocii')
      .filter(node => node.props.accessibilityRole === 'radiogroup');
    expect(groups).toHaveLength(1);
  });

  it('reports the chosen option and closes the list', async () => {
    const onChange = jest.fn();
    await render(<Controlled onChange={onChange} />);
    await fireEvent.press(field());
    await fireEvent.press(option('Engleză (en-US)'));
    expect(onChange).toHaveBeenCalledWith('en-US');
    expect(field()).toBeCollapsed();
    expect(field().props.accessibilityValue).toEqual({
      text: 'Engleză (en-US)',
    });
  });

  it('closes without a change on the backdrop or on the chosen option', async () => {
    const onChange = jest.fn();
    await render(<Controlled onChange={onChange} />);
    await fireEvent.press(field());
    await fireEvent.press(screen.getByRole('button', { name: 'Închide' }));
    expect(field()).toBeCollapsed();
    await fireEvent.press(field());
    await fireEvent.press(option('Română (ro-RO)'));
    expect(field()).toBeCollapsed();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not open when disabled', async () => {
    await render(
      <Select<Lang>
        label="Limba vocii"
        options={OPTIONS}
        value="ro-RO"
        onChange={jest.fn()}
        closeLabel="Închide"
        disabled
      />,
    );
    expect(field()).toBeDisabled();
    await fireEvent.press(field());
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('looks like a text field and grows with the font scale', async () => {
    await render(<Controlled />);
    const { style } = field().props;
    const flat = StyleSheet.flatten(
      typeof style === 'function' ? style({ pressed: false }) : style,
    );
    expect(flat).toMatchObject({
      minHeight: size.input,
      borderColor: color.border,
      backgroundColor: color.surface,
    });
    expect(flat.height).toBeUndefined();
    expect(
      screen.getByText('Română (ro-RO)').props.maxFontSizeMultiplier,
    ).toBeUndefined();
  });
});

describe('useSelect', () => {
  it('shows an empty label for a value missing from the options', async () => {
    const { result } = await renderHook(() =>
      useSelect<string>({
        options: OPTIONS,
        value: 'fr-FR',
        onChange: jest.fn(),
      }),
    );
    expect(result.current.selectedLabel).toBe('');
    await act(() => result.current.show());
    expect(result.current.open).toBe(true);
    await act(() => result.current.hide());
    expect(result.current.open).toBe(false);
  });
});
