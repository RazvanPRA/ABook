import type { IconName } from '../Icon';

/** `plain`: bare 44 pt icon (back, bookmark, skip). `filled`: 76 pt accent circle (play / pause). */
export type IconButtonVariant = 'plain' | 'filled';

export interface IconButtonProps {
  icon: IconName;
  /** Required: an icon alone says nothing to a screen reader. Already translated. */
  accessibilityLabel: string;
  onPress: () => void;
  variant?: IconButtonVariant;
  /** Toggled state (e.g. bookmark set): accent tint and `selected` for accessibility. */
  active?: boolean;
  disabled?: boolean;
}
