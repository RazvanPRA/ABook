import type { ImportContext } from '../model/dependencies';
import { ImportCancelledError } from '../model/errors';

/**
 * Stops the pipeline at a step boundary once the user cancelled. Pending extractor calls are
 * already rejected by `close`; this covers the steps that don't call the extractor (storage
 * writes, the final toc and meta), so a cancelled import never ends `ready`.
 */
export function throwIfCancelled(context: ImportContext): void {
  if (context.isCancelled()) {
    throw new ImportCancelledError();
  }
}
