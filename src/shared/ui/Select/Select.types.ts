export interface SelectOption<T extends string> {
  value: T;
  /** Already translated label. */
  label: string;
}

export interface SelectProps<T extends string> {
  /** Already translated; shown above the field, read as its name and as the list's title. */
  label: string;
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Already translated name of the backdrop that closes the list ("Închide"). */
  closeLabel: string;
  disabled?: boolean;
}

/** One row of the open list, ready to render. */
export interface SelectItem<T extends string> extends SelectOption<T> {
  selected: boolean;
  onPress: () => void;
}
