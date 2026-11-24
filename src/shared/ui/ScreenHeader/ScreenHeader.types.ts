import type { ReactNode } from 'react';
import type { IconName } from '../Icon';

export interface ScreenHeaderBack {
  /** `chevron-left` for stack screens, `chevron-down` for the player. */
  icon: Extract<IconName, 'chevron-left' | 'chevron-down'>;
  /** Already translated ("Înapoi", "Închide playerul"). */
  accessibilityLabel: string;
  onPress: () => void;
}

/**
 * `large`: display title on the left ("Biblioteca mea", "Setări"), after the back button if any
 * ("Importă PDF").
 * `compact`: back button, centered overline + title (Player, Book details).
 */
export type ScreenHeaderVariant = 'large' | 'compact';

export interface ScreenHeaderProps {
  /** Empty in a compact header whose screen shows the title below (Book details). */
  title: string;
  variant?: ScreenHeaderVariant;
  /** Small line above the title in the compact variant (chapter name). */
  overline?: string;
  back?: ScreenHeaderBack;
  /** Right slot: IconButton(s). */
  right?: ReactNode;
}
