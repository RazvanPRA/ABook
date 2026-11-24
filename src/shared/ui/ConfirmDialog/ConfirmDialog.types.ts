import type { ButtonProps } from '../Button';

export interface ConfirmDialogProps {
  visible: boolean;
  /** Already translated. */
  title: string;
  /** What will happen, one paragraph each. */
  lines: readonly string[];
  /** The action; `danger` by default. */
  confirm: Pick<ButtonProps, 'label' | 'onPress' | 'variant'>;
  /** Also what the backdrop and the back button do. */
  cancel: Pick<ButtonProps, 'label' | 'onPress'>;
}
