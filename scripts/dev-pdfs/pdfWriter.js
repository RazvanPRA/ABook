// A minimal PDF 1.4 writer for the dev test PDFs: Helvetica text pages, raw grayscale images, and
// the standard security handler (RC4 40-bit, revision 2) for a password-protected file.
// Text is WinAnsi (latin1): â and î work, ă ș ț don't (the real Romanian sample covers those).
/* eslint-disable no-bitwise -- RC4, byte layouts and a test image pattern are bit manipulation */
const crypto = require('crypto');

/** The 32-byte password padding of the PDF standard security handler (PDF 1.7 §7.6.3.3). */
const PASSWORD_PADDING = Buffer.from(
  '28bf4e5e4e758a4164004e56fffa01082e2e00b6d0683e802f0ca9fe6453697a',
  'hex',
);

/** RC4 (the cipher of the PDF standard security handler, revisions 2 and 3). */
function rc4(key, data) {
  const s = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key[i % key.length]) % 256;
    [s[i], s[j]] = [s[j], s[i]];
  }
  const out = Buffer.alloc(data.length);
  let i = 0;
  j = 0;
  for (let n = 0; n < data.length; n++) {
    i = (i + 1) % 256;
    j = (j + s[i]) % 256;
    [s[i], s[j]] = [s[j], s[i]];
    out[n] = data[n] ^ s[(s[i] + s[j]) % 256];
  }
  return out;
}

const md5 = (...parts) =>
  crypto.createHash('md5').update(Buffer.concat(parts)).digest();

const padPassword = password =>
  Buffer.concat([Buffer.from(password, 'latin1'), PASSWORD_PADDING]).subarray(
    0,
    32,
  );

/** Encryption dictionary values and the file key, revision 2 (40-bit RC4). */
function standardSecurity(userPassword, ownerPassword, fileId) {
  const permissions = -44; // print, copy, … all allowed; only opening needs the password
  const ownerKey = md5(padPassword(ownerPassword)).subarray(0, 5);
  const o = rc4(ownerKey, padPassword(userPassword));
  const p = Buffer.alloc(4);
  p.writeInt32LE(permissions);
  const fileKey = md5(padPassword(userPassword), o, p, fileId).subarray(0, 5);
  const u = rc4(fileKey, PASSWORD_PADDING);
  return { o, u, permissions, fileKey };
}

/** The RC4 key of one object (PDF 1.7 §7.6.2, algorithm 1). */
function objectKey(fileKey, objectNumber) {
  const suffix = Buffer.from([
    objectNumber & 0xff,
    (objectNumber >> 8) & 0xff,
    (objectNumber >> 16) & 0xff,
    0,
    0,
  ]);
  return md5(fileKey, suffix).subarray(0, Math.min(fileKey.length + 5, 16));
}

const hex = buffer => `<${buffer.toString('hex')}>`;

/** A PDF literal string, escaped. */
const literal = text => `(${text.replace(/[\\()]/g, char => `\\${char}`)})`;

/**
 * Collects objects and serializes the file. `add(dict, stream?)` returns the object number; a
 * stream's bytes are encrypted when `password` is set (dictionaries hold no strings then).
 */
function createPdf({ password = null } = {}) {
  const objects = [];
  const add = (dict, stream = null) => {
    objects.push({ dict, stream });
    return objects.length;
  };
  const reserve = () => add('null');
  const set = (number, dict, stream = null) => {
    objects[number - 1] = { dict, stream };
  };

  const serialize = ({ root, info = null }) => {
    const fileId = crypto
      .createHash('md5')
      .update(String(objects.length))
      .digest();
    const security = password
      ? standardSecurity(password, `${password}-owner`, fileId)
      : null;
    const encryptRef = security
      ? add(
          `<< /Filter /Standard /V 1 /R 2 /Length 40 /O ${hex(security.o)} /U ${hex(security.u)} /P ${security.permissions} >>`,
        )
      : null;
    const parts = [Buffer.from('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n', 'latin1')];
    const offsets = [];
    let length = parts[0].length;
    objects.forEach(({ dict, stream }, index) => {
      const number = index + 1;
      offsets.push(length);
      let body;
      if (stream) {
        const bytes =
          security && number !== encryptRef
            ? rc4(objectKey(security.fileKey, number), stream)
            : stream;
        body = Buffer.concat([
          Buffer.from(
            `${number} 0 obj\n${dict.replace(/>>\s*$/, `/Length ${bytes.length} >>`)}\nstream\n`,
            'latin1',
          ),
          bytes,
          Buffer.from('\nendstream\nendobj\n', 'latin1'),
        ]);
      } else {
        body = Buffer.from(`${number} 0 obj\n${dict}\nendobj\n`, 'latin1');
      }
      parts.push(body);
      length += body.length;
    });
    const xref = [
      'xref',
      `0 ${objects.length + 1}`,
      '0000000000 65535 f ',
      ...offsets.map(offset => `${String(offset).padStart(10, '0')} 00000 n `),
    ].join('\n');
    const trailer = [
      `<< /Size ${objects.length + 1} /Root ${root} 0 R`,
      info ? `/Info ${info} 0 R` : '',
      encryptRef ? `/Encrypt ${encryptRef} 0 R` : '',
      `/ID [${hex(fileId)} ${hex(fileId)}] >>`,
    ].join(' ');
    parts.push(
      Buffer.from(
        `${xref}\ntrailer\n${trailer}\nstartxref\n${length}\n%%EOF\n`,
        'latin1',
      ),
    );
    return Buffer.concat(parts);
  };

  return { add, reserve, set, serialize };
}

module.exports = { createPdf, literal, rc4, objectKey, standardSecurity };
