import { FINGERPRINT_HEAD_BYTES, pdfFingerprint } from '../pdfFingerprint';

const ascii = (text: string) =>
  Uint8Array.from(text, char => char.charCodeAt(0));

describe('pdfFingerprint', () => {
  it('is the size and the SHA-256 of the head (FIPS 180-2 "abc" vector)', () => {
    expect(pdfFingerprint(3, ascii('abc'))).toBe(
      '3:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('differs when only the size differs', () => {
    const head = ascii('%PDF-1.4');
    expect(pdfFingerprint(100, head)).not.toBe(pdfFingerprint(101, head));
  });

  it('hashes 64 KB heads', () => {
    expect(FINGERPRINT_HEAD_BYTES).toBe(65536);
    expect(pdfFingerprint(1, new Uint8Array(0))).toMatch(/^1:[0-9a-f]{64}$/);
  });
});
