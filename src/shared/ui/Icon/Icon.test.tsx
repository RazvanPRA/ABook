import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { color, size } from '@/shared/theme';
import { Icon } from './Icon';
import { icons, type IconName } from './icons';

describe('Icon', () => {
  it.each(Object.keys(icons) as IconName[])('renders %s', async name => {
    await render(<Icon name={name} testID="icon" />);
    expect(
      screen.getByTestId('icon', { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it('uses the size and color tokens', async () => {
    await render(<Icon name="play" size="lg" color="accent" testID="icon" />);
    const icon = screen.getByTestId('icon', { includeHiddenElements: true });
    expect(icon.props).toMatchObject({
      width: size.icon.lg,
      height: size.icon.lg,
      stroke: color.accent,
    });
  });

  it('fills playback glyphs by default, others only on request', async () => {
    await render(
      <>
        <Icon name="play" testID="play" />
        <Icon name="book" testID="book" />
        <Icon name="book" filled testID="filled-book" />
      </>,
    );
    const fill = (id: string) =>
      screen.getByTestId(id, { includeHiddenElements: true }).props.fill;
    expect(fill('play')).toBe(color.text);
    expect(fill('book')).toBe('none');
    expect(fill('filled-book')).toBe(color.text);
  });

  it('is hidden from accessibility', async () => {
    await render(<Icon name="book" testID="icon" />);
    expect(screen.queryByTestId('icon')).toBeNull();
    expect(
      screen.getByTestId('icon', { includeHiddenElements: true }),
    ).toBeTruthy();
  });
});
