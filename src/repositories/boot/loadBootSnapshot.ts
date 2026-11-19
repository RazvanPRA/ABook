import {
  bookMetaSchema,
  bookOrderSchema,
  type BookId,
  type BookMeta,
} from '@/shared/domain';
import { logger } from '@/shared/utils';
import {
  bookIdFromKey,
  isMetaKey,
  rootKey,
  type KeyValueStore,
} from '@/storage';
import { readJson } from '../readJson';
import { settingsFromStored } from '../settings';
import type { BootSnapshot } from './BootRepository';

const BOOKS_KEY = rootKey('books');
const SETTINGS_KEY = rootKey('settings');

const metasById = (raw: Record<string, string | null>, metaKeys: string[]) => {
  const metas = new Map<BookId, BookMeta>();
  metaKeys.forEach(key => {
    const meta = readJson(raw[key], bookMetaSchema, key);
    if (meta !== null && meta.id === bookIdFromKey(key)) {
      metas.set(meta.id, meta);
    }
  });
  return metas;
};

/** When `abk:books` is unreadable, the library is rebuilt from the metas, newest import first. */
const orderFromMetas = (metas: ReadonlyMap<BookId, BookMeta>): BookId[] =>
  [...metas.values()]
    .sort((a, b) => b.importedAt.localeCompare(a.importedAt))
    .map(meta => meta.id);

/** `getAllKeys` (keys only) → one `getMany` with the order, the settings and every meta. */
export const loadBootSnapshot = async (
  kv: KeyValueStore,
): Promise<BootSnapshot> => {
  const keys = await kv.getAllKeys();
  const metaKeys = keys.filter(isMetaKey);
  const raw = await kv.getMany([BOOKS_KEY, SETTINGS_KEY, ...metaKeys]);
  const rawOrder = raw[BOOKS_KEY] ?? null;
  const parsedOrder = readJson(rawOrder, bookOrderSchema, BOOKS_KEY);
  const metas = metasById(raw, metaKeys);
  const order = parsedOrder ?? (rawOrder === null ? [] : orderFromMetas(metas));
  const books = order.flatMap(id => {
    const meta = metas.get(id);
    if (meta === undefined) {
      logger.warn('Listed book has no valid meta, hidden', { id });
    }
    return meta === undefined ? [] : [meta];
  });
  return {
    books,
    settings: settingsFromStored(raw[SETTINGS_KEY]),
    order,
    orderValid: rawOrder === null || parsedOrder !== null,
    keys,
  };
};
