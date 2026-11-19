import type { ReactNode } from 'react';

/** `default`: regular row. `muted`: finished item (chapter listened). `active`: current item, bold. */
export type ListRowTone = 'default' | 'muted' | 'active';

export interface ListRowProps {
  /** Already translated. */
  title: string;
  subtitle?: string;
  /** Slot before the text: icon, small cover. */
  leading?: ReactNode;
  /** Slot after the text: Switch, value text, chevron. */
  trailing?: ReactNode;
  /** When set, the whole row is a button. */
  onPress?: () => void;
  /** Bottom separator; off for the last row of a group. */
  divider?: boolean;
  tone?: ListRowTone;
}
