export type ProgressTone = 'accent' | 'success' | 'info';

export interface ProgressBarProps {
  /** Progress in [0, 1]; values outside (or NaN) are clamped. */
  value: number;
  tone?: ProgressTone;
  /** Already translated ("Progres ascultare"). */
  accessibilityLabel: string;
}
