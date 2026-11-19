import type { ButtonProps } from '../Button';
import type { IconName } from '../Icon';

export interface EmptyStateProps {
  icon: IconName;
  /** Already translated. */
  title: string;
  description: string;
  /** Main call to action, rendered as a large primary Button. */
  action?: Pick<ButtonProps, 'label' | 'onPress' | 'icon'>;
  /** Small print under the action. */
  note?: string;
}
