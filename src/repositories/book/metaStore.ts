import { bookMetaSchema, type BookId, type BookMeta } from '@/shared/domain';
import { logger } from '@/shared/utils';
import { bookKey, type Entries, type KeyValueStore } from '@/storage';
import { readJson } from '../readJson';
import { readValue } from '../readValue';
import { serialize } from '../serialize';

/** The meta entry, validated before it is written: an invalid meta is a programming error. */
export const metaEntry = (meta: BookMeta): Entries => {
  const key = bookKey(meta.id, 'meta');
  return { [key]: serialize(key, bookMetaSchema.parse(meta)) };
};

export const readMeta = (
  kv: KeyValueStore,
  id: BookId,
): Promise<BookMeta | null> =>
  readValue(kv, bookKey(id, 'meta'), bookMetaSchema);

/** All metas in one `getMany`, in the given order; missing or invalid ones are skipped and logged. */
export const readMetas = async (
  kv: KeyValueStore,
  ids: readonly BookId[],
): Promise<BookMeta[]> => {
  const raw = await kv.getMany(ids.map(id => bookKey(id, 'meta')));
  return ids.flatMap(id => {
    const key = bookKey(id, 'meta');
    const meta = readJson(raw[key], bookMetaSchema, key);
    if (meta === null && raw[key] === null) {
      logger.warn('Book listed without meta, skipped', { key });
    }
    return meta === null ? [] : [meta];
  });
};
