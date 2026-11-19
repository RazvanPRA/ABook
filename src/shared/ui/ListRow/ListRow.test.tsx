import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { color, size, type } from '@/shared/theme';
import { ListRow } from './ListRow';

describe('ListRow', () => {
  it('renders title, subtitle and both slots', async () => {
    await render(
      <ListRow
        title="Redare în fundal"
        subtitle="Continuă cu ecranul blocat"
        leading={<Text>L</Text>}
        trailing={<Text>T</Text>}
      />,
    );
    for (const text of [
      'Redare în fundal',
      'Continuă cu ecranul blocat',
      'L',
      'T',
    ]) {
      expect(screen.getByText(text)).toBeOnTheScreen();
    }
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('becomes a 44 pt button announced by its text when pressable', async () => {
    const onPress = jest.fn();
    await render(
      <ListRow title="Partea a II-a" subtitle="p. 22–43" onPress={onPress} />,
    );
    const row = screen.getByRole('button', { name: /Partea a II-a/ });
    expect(StyleSheet.flatten(row.props.style).minHeight).toBe(
      size.touchTarget,
    );
    await fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('draws the divider unless disabled', async () => {
    await render(
      <>
        <ListRow title="a" onPress={jest.fn()} />
        <ListRow title="b" onPress={jest.fn()} divider={false} />
      </>,
    );
    const [first, last] = screen.getAllByRole('button');
    expect(StyleSheet.flatten(first?.props.style).borderBottomColor).toBe(
      color.divider,
    );
    expect(
      StyleSheet.flatten(last?.props.style).borderBottomWidth,
    ).toBeUndefined();
  });

  it.each([
    ['muted', color.textRead, type.body.fontFamily],
    ['active', color.text, type.bodyStrong.fontFamily],
  ] as const)('styles the %s tone', async (tone, textColor, fontFamily) => {
    await render(<ListRow title="Partea I" tone={tone} />);
    expect(
      StyleSheet.flatten(screen.getByText('Partea I').props.style),
    ).toMatchObject({
      color: textColor,
      fontFamily,
    });
  });
});
