/** The speeds of the player (PROMPT §6). */
export const RATES = [0.75, 0.9, 1, 1.25, 1.5, 2] as const;

/** "0.75×", "1.0×": at least one decimal, as in the mockup. */
export function formatRate(rate: number): string {
  const text = String(Number(rate.toFixed(2)));
  return `${text.includes('.') ? text : `${text}.0`}×`;
}
