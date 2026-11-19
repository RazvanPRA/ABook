export interface SliderRange {
  min: number;
  max: number;
  step?: number;
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
