import { progressSchema, type Progress } from '../schemas';
import { NOW } from './rawValues';

/** A valid progress, started and unfinished unless overridden. */
export const makeProgress = (overrides: Partial<Progress> = {}): Progress =>
  progressSchema.parse({
    chapter: 1,
    sentence: 4,
    page: 34,
    finished: false,
    updatedAt: NOW,
    ...overrides,
  });
