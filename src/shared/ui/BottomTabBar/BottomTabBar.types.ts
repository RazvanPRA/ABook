import type { IconName } from '../Icon';

/** One tab, already resolved by the navigation adapter (no React Navigation types in shared). */
export interface BottomTabItem {
  key: string;
  /** Already translated. */
  label: string;
  icon: IconName;
  focused: boolean;
  onPress: () => void;
}

export interface BottomTabBarProps {
  items: readonly BottomTabItem[];
}
