import { charFromCode } from './letters';

/** Typographic ligatures that pdf.js returns as single characters; the TTS would misread them. */
const LIGATURES: readonly (readonly [string, string])[] = [
  [charFromCode(0xfb00), 'ff'],
  [charFromCode(0xfb01), 'fi'],
  [charFromCode(0xfb02), 'fl'],
  [charFromCode(0xfb03), 'ffi'],
  [charFromCode(0xfb04), 'ffl'],
  [charFromCode(0xfb05), 'st'],
  [charFromCode(0xfb06), 'st'],
];

/** Replaces Latin ligatures (ﬁ, ﬂ, ﬀ, ﬃ, ﬄ, ﬅ, ﬆ) with their letters. */
export function expandLigatures(text: string): string {
  return LIGATURES.reduce(
    (result, [from, to]) => result.split(from).join(to),
    text,
  );
}
