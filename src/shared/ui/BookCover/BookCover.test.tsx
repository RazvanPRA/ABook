import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { toBookId } from '@/shared/domain';
import { pickCoverColor, size } from '@/shared/theme';
import { BookCover } from './BookCover';

const id = toBookId('3f1c2d9e-0b7a-4c55-9a1e-6d2f8b4c7e10');
const LABEL = 'Copertă: Amintiri din copilărie, Ion Creangă';
const cover = () => screen.getByRole('image', { name: LABEL });

describe('BookCover', () => {
  it('shows author and title on the large cover', async () => {
    await render(
      <BookCover
        id={id}
        title="Amintiri din copilărie"
        author="Ion Creangă"
        size="lg"
        accessibilityLabel={LABEL}
      />,
    );
    expect(cover()).toBeOnTheScreen();
    expect(
      screen.getByText('Ion Creangă', { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(StyleSheet.flatten(cover().props.style)).toMatchObject({
      width: size.coverLg.width,
      height: size.coverLg.height,
    });
  });

  it('shows the title initial on the small cover', async () => {
    await render(
      <BookCover id={id} title=" amintiri" accessibilityLabel={LABEL} />,
    );
    expect(screen.getByText('A', { includeHiddenElements: true })).toBeTruthy();
    expect(StyleSheet.flatten(cover().props.style).width).toBe(
      size.coverSm.width,
    );
  });

  it('uses the deterministic color of the id', async () => {
    const { rerender } = await render(
      <BookCover id={id} title="x" accessibilityLabel={LABEL} />,
    );
    const first = StyleSheet.flatten(cover().props.style).backgroundColor;
    expect(first).toBe(pickCoverColor(id));
    await rerender(<BookCover id={id} title="y" accessibilityLabel={LABEL} />);
    expect(StyleSheet.flatten(cover().props.style).backgroundColor).toBe(first);
  });
});
