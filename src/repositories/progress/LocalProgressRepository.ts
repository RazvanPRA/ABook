import { bookmarksSchema, progressSchema } from '@/shared/domain';
import { bookKey, type KeyValueStore } from '@/storage';
import { readValue } from '../readValue';
import { serialize } from '../serialize';
import type { ProgressRepository } from './ProgressRepository';

/** `ProgressRepository` over `abk:book:{id}:progress` and `abk:book:{id}:bookmarks`. */
export const createLocalProgressRepository = ({
  kv,
}: {
  kv: KeyValueStore;
}): ProgressRepository => ({
  getProgress: id => readValue(kv, bookKey(id, 'progress'), progressSchema),

  async saveProgress(id, progress) {
    const key = bookKey(id, 'progress');
    await kv.setMany({ [key]: serialize(key, progressSchema.parse(progress)) });
  },

  async getBookmarks(id) {
    return (
      (await readValue(kv, bookKey(id, 'bookmarks'), bookmarksSchema)) ?? []
    );
  },

  async saveBookmarks(id, bookmarks) {
    const key = bookKey(id, 'bookmarks');
    await kv.setMany({
      [key]: serialize(key, bookmarksSchema.parse(bookmarks)),
    });
  },
});
