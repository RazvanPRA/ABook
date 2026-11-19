import {
  chapterChunkSchema,
  chapterEntrySchema,
  type BookId,
  type ChapterChunk,
  type ChapterIndex,
} from '@/shared/domain';
import { logger } from '@/shared/utils';
import { chapterKey, type Entries, type KeyValueStore } from '@/storage';
import { joinChapterParts, splitChapterChunk } from '../chapterChunking';
import { readJson } from '../readJson';
import { readValue } from '../readValue';
import { serialize } from '../serialize';

export interface ChapterRef {
  id: BookId;
  index: ChapterIndex;
}

const partKeys = ({ id, index }: ChapterRef, from: number, to: number) =>
  Array.from({ length: Math.max(0, to - from) }, (_, k) =>
    chapterKey(id, index, from + k),
  );

/** Number of parts currently stored for the chapter (0 when it is whole or missing). */
const storedPartCount = async (kv: KeyValueStore, ref: ChapterRef) => {
  const entry = await readValue(
    kv,
    chapterKey(ref.id, ref.index),
    chapterEntrySchema,
  );
  return entry !== null && 'parts' in entry ? entry.parts : 0;
};

/** `ch:{n}` with the chunk, or `ch:{n}` with the manifest plus `ch:{n}:p:{k}` with the parts. */
const chapterEntries = (ref: ChapterRef, parts: ChapterChunk[]): Entries => {
  const key = chapterKey(ref.id, ref.index);
  const [only] = parts;
  if (parts.length === 1 && only !== undefined) {
    return { [key]: serialize(key, only) };
  }
  const entries: Entries = { [key]: serialize(key, { parts: parts.length }) };
  partKeys(ref, 0, parts.length).forEach((partKey, k) => {
    entries[partKey] = serialize(partKey, parts[k]);
  });
  return entries;
};

/** Writes the chapter in one batch, then removes parts left over from a larger previous version. */
export const saveChapter = async (
  kv: KeyValueStore,
  ref: ChapterRef,
  chunk: ChapterChunk,
): Promise<void> => {
  const parts = splitChapterChunk(chapterChunkSchema.parse(chunk));
  const previous = await storedPartCount(kv, ref);
  await kv.setMany(chapterEntries(ref, parts));
  const kept = parts.length === 1 ? 0 : parts.length;
  await kv.removeMany(partKeys(ref, kept, previous));
};

export const readChapter = async (
  kv: KeyValueStore,
  ref: ChapterRef,
): Promise<ChapterChunk | null> => {
  const key = chapterKey(ref.id, ref.index);
  const entry = await readValue(kv, key, chapterEntrySchema);
  if (entry === null || !('parts' in entry)) {
    return entry;
  }
  const keys = partKeys(ref, 0, entry.parts);
  const raw = await kv.getMany(keys);
  const parts = keys
    .map(partKey => readJson(raw[partKey], chapterChunkSchema, partKey))
    .filter((part): part is ChapterChunk => part !== null);
  if (parts.length !== keys.length) {
    logger.warn('Chapter has missing or invalid parts, treated as missing', {
      key,
    });
    return null;
  }
  return joinChapterParts(parts);
};
