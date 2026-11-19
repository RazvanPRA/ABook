import type { IconName } from '../Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
/** `md` = 44 pt; `lg` = 52 pt pill CTA ("Importă primul PDF", "Continuă de la pagina 34"). */
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps {
  /** Already translated label; also the accessibility label. */
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon. */
  icon?: IconName;
  /** Shows a spinner and blocks presses. */
  loading?: boolean;
  disabled?: boolean;
}
