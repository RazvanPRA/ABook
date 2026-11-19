export interface ChipProps {
  /** Already translated label. */
  label: string;
  selected?: boolean;
  /** Without `onPress` the chip is static metadata ("82 pagini"), not a control. */
  onPress?: () => void;
  /** `radio` when the chip lives inside a ChipGroup; defaults to `button`. */
  accessibilityRole?: 'button' | 'radio';
}
