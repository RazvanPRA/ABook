/** Unit words, from `format.duration` in ro.json. */
export interface DurationUnits {
  hour: string;
  minute: string;
  /** Shown for 0 < duration < 30 s ("< 1 min"). */
  lessThanMinute: string;
}

/**
 * Remaining listening time rounded to the minute: "1 h 52 min", "2 h", "12 min", "< 1 min".
 * Negative or NaN durations count as 0 ("0 min"). The "~" / "rămase" wording belongs to the caller.
 */
export const formatDuration = (
  seconds: number,
  units: DurationUnits,
): string => {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const totalMinutes = Math.round(safe / 60);
  if (safe > 0 && totalMinutes === 0) {
    return units.lessThanMinute;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes} ${units.minute}`;
  }
  return minutes === 0
    ? `${hours} ${units.hour}`
    : `${hours} ${units.hour} ${minutes} ${units.minute}`;
};
