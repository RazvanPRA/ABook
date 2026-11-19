import { type ChapterChunk, toPageNumber } from '@/shared/domain';
import { expandLigatures } from './expandLigatures';
import { HEADING_SCALE } from './findChapterHeading';
import { joinHyphenatedWords } from './joinHyphenatedWords';
import { medianLineHeight } from './medianLineHeight';
import { normalizeDiacritics } from './normalizeDiacritics';
import { normalizeWhitespace } from './normalizeWhitespace';
import { segmentSentences } from './segmentSentences';
import { splitLongSentence } from './splitLongSentence';
import type { PageText } from './types';

/** Text segmented on its own, with the page where each of its lines starts. */
interface Block {
  text: string;
  /** Offsets of the lines in `text`, ascending, with their page. */
  readonly lineStarts: { offset: number; page: number }[];
}

/**
 * The sentences of one chapter and the page of each, from its pages (headers and page numbers
 * already removed). Words split at line ends are joined, characters normalized, then the text is
 * segmented; sentences over 400 characters are split (each part keeps the page where the sentence
 * starts). Lines taller than the body text (titles) are segmented apart, so `Capitolul I` becomes a
 * sentence of its own instead of merging into the first sentence.
 */
export function buildChapterChunk(pages: readonly PageText[]): ChapterChunk {
  const joined = joinHyphenatedWords(pages);
  const headingHeight = medianLineHeight(joined) * HEADING_SCALE;
  const chunk: ChapterChunk = { sentences: [], sentencePages: [] };
  for (const block of toBlocks(joined, headingHeight)) {
    for (const sentence of segmentSentences(block.text)) {
      const page = toPageNumber(pageAt(block, sentence.start));
      for (const part of splitLongSentence(sentence.text)) {
        chunk.sentences.push(part);
        chunk.sentencePages.push(page);
      }
    }
  }
  return chunk;
}

/** Consecutive body lines form one block; each tall line is a block of its own. */
function toBlocks(pages: readonly PageText[], headingHeight: number): Block[] {
  const blocks: Block[] = [];
  let body: Block | null = null;
  for (const page of pages) {
    for (const line of page.lines) {
      const text = cleanLine(line.text);
      const isTitle = line.height > headingHeight;
      const block: Block =
        body && !isTitle ? body : { text: '', lineStarts: [] };
      if (block !== body) {
        blocks.push(block);
      }
      appendLine(block, text, page.page);
      body = isTitle ? null : block;
    }
  }
  return blocks;
}

function appendLine(block: Block, text: string, page: number): void {
  const separator = block.text === '' ? '' : ' ';
  block.lineStarts.push({ offset: block.text.length + separator.length, page });
  block.text += separator + text;
}

function cleanLine(text: string): string {
  return normalizeWhitespace(normalizeDiacritics(expandLigatures(text)));
}

/** The page of the line that contains `offset`. */
function pageAt(block: Block, offset: number): number {
  let page = 0;
  for (const start of block.lineStarts) {
    if (start.offset > offset) {
      break;
    }
    page = start.page;
  }
  return page;
}
