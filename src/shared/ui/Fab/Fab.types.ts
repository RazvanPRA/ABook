import type { IconName } from '../Icon';

export interface FabProps {
  /** Already translated; also the accessibility label. */
  label: string;
  icon: IconName;
  onPress: () => void;
}
