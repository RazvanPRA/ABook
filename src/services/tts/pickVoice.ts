import type { Voice } from './types';

export interface PickedVoice {
  /** `null`: no voice of the language is installed. */
  readonly voice: Voice | null;
  /** The saved voice isn't on the device any more, so another one speaks. */
  readonly replaced: boolean;
}

const baseOf = (language: string) => language.split('-')[0]?.toLowerCase();

const speaks = (voice: Voice, language: string) =>
  baseOf(voice.language) === baseOf(language);

/**
 * The voice a book is read with: the saved one if it speaks the book's language, otherwise the
 * first of that language, its own region before the others. The saved voice is global, so one of
 * another language is not missing, only unused here.
 */
export function pickVoice(
  voices: readonly Voice[],
  { savedId, language }: { savedId: string | null; language: string },
): PickedVoice {
  const saved = voices.find(({ id }) => id === savedId);
  if (saved && speaks(saved, language)) {
    return { voice: saved, replaced: false };
  }
  const candidates = voices.filter(voice => speaks(voice, language));
  const voice =
    candidates.find(candidate => candidate.language === language) ??
    candidates[0] ??
    null;
  return { voice, replaced: savedId !== null && saved === undefined };
}
