export interface TextFieldProps {
  /** Already translated; shown above the field and read as the field's name. */
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  /** Already translated; shows the error state under the field and is announced. */
  error?: string | null;
  placeholder?: string;
  /** Read-only when false; defaults to true. */
  editable?: boolean;
}
