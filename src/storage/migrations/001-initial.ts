import type { Migration } from './types';

/** 0 → 1: the first schema (key table of the `audiobook-storage` skill). Only records the version. */
export const initialMigration: Migration = {
  version: 1,
  name: 'initial',
  migrate: entries => ({ ...entries }),
};
