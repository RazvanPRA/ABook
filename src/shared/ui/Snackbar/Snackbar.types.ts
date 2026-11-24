import type { ButtonProps } from '../Button';

export interface SnackbarProps {
  /** Already translated. */
  message: string;
  action?: Pick<ButtonProps, 'label' | 'onPress'>;
}
