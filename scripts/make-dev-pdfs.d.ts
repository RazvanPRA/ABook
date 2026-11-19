// Types for scripts/make-dev-pdfs.js (a Node script), used by its tests.

/** Every generated dev PDF, by file name. */
export function buildAll(): Record<string, Buffer>;
/** Splits text into lines of at most `max` characters, hyphenating long words. */
export function wrap(text: string, max: number): string[];
/** WinAnsi bytes of `text`; throws on a character WinAnsi lacks. */
export function winAnsi(text: string): Buffer;
