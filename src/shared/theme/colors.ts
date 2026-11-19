/**
 * Color tokens (PROMPT §7). Dark theme with a single amber accent.
 * Components never use hex values directly (enforced by ESLint outside src/shared/theme).
 */
export const color = {
  /** Screen background. */
  bg: '#111316',
  /** Cards, inputs. */
  surface: '#1B1E23',
  /** Secondary buttons, select. */
  surfaceRaised: '#252931',
  /** Outlines, progress bar track. */
  border: '#2E333B',
  /** Separators between rows. */
  divider: '#22262C',
  /** Bottom navigation bar. */
  tabBar: '#15181C',
  /** Primary text. */
  text: '#F2EFE9',
  /** Secondary text, labels. */
  textMuted: '#A3A9B3',
  /** Sentences already read. */
  textRead: '#8A9099',
  /** Main action, progress, active element. */
  accent: '#F0B13C',
  /** Content on top of `accent`. */
  onAccent: '#1A1405',
  /** Finished step, chapter listened. */
  success: '#7FD8B4',
  successBg: '#2B4A3E',
  /** Destructive actions. */
  danger: '#F08A8A',
  dangerBorder: '#4A2E2E',
  /** PDF segment of the storage bar. */
  info: '#8FA8FF',
  /** Generated covers, picked from the book id hash (see pickCoverColor). */
  cover: ['#3B4A6B', '#6B3B3B', '#3B6B57'],
} as const;

/** Name of a single-value color token (excludes the `cover` palette). */
export type ColorToken = Exclude<keyof typeof color, 'cover'>;
