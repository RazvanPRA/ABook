// Types for scripts/dev-pdfs/pdfWriter.js (a Node script), used by its tests.

export function rc4(key: Uint8Array, data: Uint8Array): Buffer;
export function objectKey(fileKey: Uint8Array, objectNumber: number): Buffer;
