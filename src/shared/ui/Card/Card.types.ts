import type { PropsWithChildren } from 'react';

/** `surface`: default card. `raised`: lighter background for nested or emphasised blocks. */
export type CardVariant = 'surface' | 'raised';

export type CardProps = PropsWithChildren<{
  variant?: CardVariant;
  /** Rows with their own padding and dividers (settings lists) need a card without inner padding. */
  padded?: boolean;
  testID?: string;
}>;
