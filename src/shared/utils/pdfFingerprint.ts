import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

/** How much of the file the fingerprint hashes (PROMPT §5: the first 64 KB). */
export const FINGERPRINT_HEAD_BYTES = 64 * 1024;

/**
 * Identifies a PDF for the duplicate check without reading it whole: its size and the SHA-256 of
 * its first 64 KB (`head`), as `<size>:<hex>`.
 */
export function pdfFingerprint(sizeBytes: number, head: Uint8Array): string {
  return `${sizeBytes}:${bytesToHex(sha256(head))}`;
}
