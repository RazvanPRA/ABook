export interface SliderRange {
  min: number;
  max: number;
  /** Without it, the value is continuous. */
  step?: number;
}

export interface SliderTrackProps {
  /** Already translated name of what it sets. */
  accessibilityLabel: string;
  /** Already formatted value ("1.0×", "Pagina 34"), announced as it is. */
  valueText: string;
  value: number;
  range: SliderRange;
  /** Fires while dragging, when the value changes; keep it cheap (UI only). */
  onChange?: (value: number) => void;
  /** Fires once on release, and for each step of a screen reader; persist here. */
  onComplete?: (value: number) => void;
  disabled?: boolean;
}

export interface SliderProps {
  /** Already translated row label ("Viteză implicită"); also the accessibility label. */
  label: string;
  /** Already formatted value ("1.0×", "Normal"); also announced as the accessibility value. */
  valueLabel: string;
  /** `accent` for numeric values (speed), `muted` for words (pitch "Normal"). */
  valueTone?: 'accent' | 'muted';
  value: number;
  range: SliderRange;
  /** Fires while dragging; keep it cheap (UI only). */
  onChange?: (value: number) => void;
  /** Fires once on release; persist here. */
  onComplete?: (value: number) => void;
}
