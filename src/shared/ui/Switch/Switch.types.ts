export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Already translated; usually the title of the row the switch sits in. */
  accessibilityLabel: string;
  disabled?: boolean;
}
