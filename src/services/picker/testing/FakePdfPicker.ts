import type { PdfPicker, PickedDocument } from '../types';

/**
 * A `PdfPicker` for tests: `next(file)` sets what the next pick returns (`null`: the user closed
 * the picker), `fail(error)` makes it reject. `picks` counts the calls.
 */
export class FakePdfPicker implements PdfPicker {
  picks = 0;
  private result: PickedDocument | null | Error = null;

  next(file: PickedDocument | null): void {
    this.result = file;
  }

  fail(error: Error): void {
    this.result = error;
  }

  async pickPdf(): Promise<PickedDocument | null> {
    this.picks += 1;
    if (this.result instanceof Error) {
      throw this.result;
    }
    return this.result;
  }
}
