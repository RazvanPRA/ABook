/** Romanian plural forms: "o pagină", "19 pagini", "20 de pagini". */
export type RomanianPlural = 'one' | 'few' | 'other';

/**
 * The plural form of a count, without Hermes' Intl (whose plural rules give `other` for every
 * Romanian count on the device: "6 de pagini"). `few` is 0 and counts whose last two digits are
 * 1–19 (except 1 itself); `other` takes "de" (20, 101 → few, 120).
 */
export const romanianPlural = (count: number): RomanianPlural => {
  if (count === 1) {
    return 'one';
  }
  const lastTwo = Math.abs(Math.trunc(count)) % 100;
  return count === 0 || (lastTwo >= 1 && lastTwo <= 19) ? 'few' : 'other';
};
