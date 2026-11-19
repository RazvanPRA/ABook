/**
 * @jest-environment node
 */
/// <reference types="node" />
import { rc4 } from '../../scripts/dev-pdfs/pdfWriter';
import { buildAll, winAnsi, wrap } from '../../scripts/make-dev-pdfs';

// pdf.js is ESM only, so it can't read the files here; the PDFs were checked with pdf.js in Node and
// on the emulator (M3 step 11). These tests guard the structure the writer must keep.

describe('make-dev-pdfs', () => {
  const files = buildAll();

  it('builds the five dev PDFs', () => {
    expect(Object.keys(files).sort()).toEqual([
      'corupt-nu-e-pdf.pdf',
      'corupt-trunchiat.pdf',
      'ion-320.pdf',
      'protejat-parola-abook.pdf',
      'scanat-6.pdf',
    ]);
  });

  it.each(['ion-320.pdf', 'protejat-parola-abook.pdf', 'scanat-6.pdf'])(
    '%s has an xref whose offsets point at their objects',
    name => {
      const text = files[name]?.toString('latin1') ?? '';
      const start = Number(/startxref\n(\d+)\n%%EOF\n$/.exec(text)?.[1]);
      expect(text.startsWith('xref\n', start)).toBe(true);
      const offsets = [...text.slice(start).matchAll(/^(\d{10}) 00000 n $/gm)];
      expect(offsets.length).toBeGreaterThan(5);
      offsets.forEach(([, offset], index) => {
        expect(text.startsWith(`${index + 1} 0 obj\n`, Number(offset))).toBe(
          true,
        );
      });
    },
  );

  it('encrypts only the protected PDF and leaves no readable text in it', () => {
    const plain = files['ion-320.pdf']?.toString('latin1') ?? '';
    const locked = files['protejat-parola-abook.pdf']?.toString('latin1') ?? '';
    expect(plain).not.toContain('/Encrypt');
    expect(plain).toContain('(Ion - roman de test) Tj');
    expect(locked).toContain('/Filter /Standard /V 1 /R 2');
    expect(locked).not.toContain('Ion - roman de test');
  });

  it('implements RC4 (RFC 6229 key "Key", text "Plaintext")', () => {
    const out = rc4(Buffer.from('Key'), Buffer.from('Plaintext'));
    expect(out.toString('hex')).toBe('bbf316e8d940af0ad3');
  });

  it('hyphenates a long word that does not fit and keeps lines within the limit', () => {
    const lines = wrap('aa bbbbbbbbbbbbbbbbbbbb cc', 12);
    expect(lines).toEqual(['aa bbbbbbbb-', 'bbbbbbbbbbbb', 'cc']);
    expect(lines.every(line => line.length <= 12)).toBe(true);
  });

  it('encodes Romanian quotes and the dialogue dash as WinAnsi, and refuses ș', () => {
    expect([...winAnsi('„â”—')]).toEqual([0x84, 0xe2, 0x94, 0x97]);
    expect(() => winAnsi('ș')).toThrow('no WinAnsi code');
  });
});
