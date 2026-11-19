export interface ChipOption<T extends string> {
  value: T;
  /** Already translated label. */
  label: string;
}

export interface ChipGroupProps<T extends string> {
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Already translated name of the group ("Filtru"). */
  accessibilityLabel: string;
}
