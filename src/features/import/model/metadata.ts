/** Metadata values PDF producers write when they know nothing; never worth prefilling. */
const PLACEHOLDERS = new Set([
  '(anonymous)',
  'anonymous',
  'unknown',
  'untitled',
]);

/** The metadata text if it is worth putting in the form; `null` for empty or placeholder values. */
export function usableMetadata(value: string | null): string | null {
  const text = value?.trim().replace(/\s+/g, ' ') ?? '';
  if (text === '' || PLACEHOLDERS.has(text.toLowerCase())) {
    return null;
  }
  return text;
}

/** A title from the file name, for PDFs without a usable `Title`: `ion-rebreanu.pdf` → `ion-rebreanu`. */
export function titleFromFileName(name: string): string {
  return name.replace(/\.pdf$/i, '').trim();
}
