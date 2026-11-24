export interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  /** Already translated; shown while empty and read as the field's name. */
  label: string;
  /** Already translated name of the "×" that empties the field. */
  clearLabel: string;
}
