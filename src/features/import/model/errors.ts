import type { ImportFailure } from './types';

/** A failure the pipeline itself detects (scanned PDF, empty document…), with its reason. */
export class ImportError extends Error {
  readonly reason: ImportFailure;

  constructor(reason: ImportFailure, message: string) {
    super(message);
    this.name = 'ImportError';
    this.reason = reason;
  }
}

/** The user cancelled: the pipeline stops at its next step and the book is removed. */
export class ImportCancelledError extends Error {
  constructor() {
    super('import cancelled');
    this.name = 'ImportCancelledError';
  }
}
