/** A document the user picked, as far as the platform tells. */
export interface PickedDocument {
  /** Display name with its extension; a fallback when the provider gives none. */
  readonly name: string;
  /** What the app can read: `content://…` on Android, a `file://` path on iOS. */
  readonly uri: string;
  /** 0 when the provider doesn't know it. */
  readonly sizeBytes: number;
}

/** The system file picker, limited to PDFs. */
export interface PdfPicker {
  /** The picked PDF, or `null` when the user closed the picker. */
  pickPdf(): Promise<PickedDocument | null>;
}
