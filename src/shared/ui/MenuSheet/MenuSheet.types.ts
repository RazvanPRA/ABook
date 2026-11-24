import type { IconName } from '../Icon';
import type { SheetModalProps } from '../SheetModal';

export interface MenuItem {
  key: string;
  /** Already translated. */
  label: string;
  icon?: IconName;
  /** `danger` for destructive actions. */
  tone?: 'default' | 'danger';
  onPress: () => void;
}

export interface MenuSheetProps extends Pick<
  SheetModalProps,
  'visible' | 'closeLabel' | 'onClose'
> {
  /** Already translated; read as the menu's name. */
  title: string;
  items: readonly MenuItem[];
}
