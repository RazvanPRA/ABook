import type { z } from 'zod';
import type { KeyValueStore } from '@/storage';
import { readJson } from './readJson';

/** Reads and validates a single key (one `getMany`); `null` when missing or invalid. */
export const readValue = async <S extends z.ZodType>(
  kv: KeyValueStore,
  key: string,
  schema: S,
): Promise<z.output<S> | null> =>
  readJson((await kv.getMany([key]))[key], schema, key);
