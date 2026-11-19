#!/usr/bin/env node
// Generates the dev test PDFs into .dev-pdfs/ (gitignored) and, with --push, copies them into the
// debug app's private files/dev-pdfs/ on the running emulator, where abook://dev/pdf lists them.
// --samples also pushes the real sample PDFs from ../Book-PDF (never committed; see the M3 plan).
//
//   node scripts/make-dev-pdfs.js [--push] [--samples]
/* eslint-disable no-bitwise -- RC4, byte layouts and a test image pattern are bit manipulation */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { createPdf, literal } = require('./dev-pdfs/pdfWriter');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, '.dev-pdfs');
const SAMPLES_DIR = path.join(ROOT, '..', 'Book-PDF');
const APP_ID = 'com.abook';
const DEVICE_DIR = 'files/dev-pdfs';

const PAGE = { width: 595, height: 842 };
const BODY = { top: 730, bottom: 60, leading: 14, size: 11, maxChars: 88 };

/** WinAnsi codes of the non-latin1 characters the text uses. */
const WIN_ANSI = new Map([
  ['„', 0x84],
  ['”', 0x94],
  ['“', 0x93],
  ['—', 0x97],
  ['…', 0x85],
]);

function winAnsi(text) {
  return Buffer.from(
    [...text].map(char => {
      const code = WIN_ANSI.get(char) ?? char.charCodeAt(0);
      if (code > 255) {
        throw new Error(`no WinAnsi code for ${char}`);
      }
      return code;
    }),
  );
}

const SUBJECTS = [
  'Ion',
  'Ana',
  'dl. Popescu',
  'Florica',
  'bătrânul Glanetașu',
  'învățătorul Herdelea',
  'preotul Belciug',
];
const VERBS = [
  'privea',
  'asculta',
  'înțelegea',
  'aștepta',
  'cerceta',
  'povestea despre',
];
const OBJECTS = [
  'pământul de lângă râu',
  'satul întreg',
  'drumul spre oraș',
  'hora de duminică',
  'casa părintească',
  'câmpul înflorit',
  'o scrisoare de la I. L. Caragiale',
];
const ENDINGS = ['.', '.', '.', '!', '?', '…'];

/** WinAnsi has â and î but not ă ș ț: they are written without the diacritic. */
const withoutBreve = text =>
  text.replace(
    /[ăĂșȘțȚ]/g,
    char => ({ ă: 'a', Ă: 'A', ș: 's', Ș: 'S', ț: 't', Ț: 'T' })[char],
  );

/** Deterministic pseudo-random sentences, with abbreviations, initials, quotes and dialogue. */
function sentence(n) {
  const pick = (list, salt) =>
    list[(n * 7 + salt * 13 + Math.floor(n / 3)) % list.length];
  if (n % 11 === 0) {
    return withoutBreve('— Nu știu, a spus el, „poate mâine”.');
  }
  const text = `${pick(SUBJECTS, 1)} ${pick(VERBS, 2)} ${pick(OBJECTS, 3)} și se gândea la neprevăzutele întâmplări ale vieții`;
  return withoutBreve(
    `${text[0].toUpperCase()}${text.slice(1)}${pick(ENDINGS, 4)}`,
  );
}

/** Splits text into lines of at most `max` characters, hyphenating long words that don't fit. */
function wrap(text, max) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= max) {
      line = candidate;
      continue;
    }
    const room = max - line.length - 2;
    if (word.length > 8 && room >= 4) {
      lines.push(`${line} ${word.slice(0, room)}-`);
      line = word.slice(room);
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const textOp = (x, y, size, text) =>
  `BT /F1 ${size} Tf ${x} ${y} Td ${literal(text)} Tj ET`;

/** The content stream of one page of the long book. */
function bookPage(number, nextSentence) {
  const ops = [
    textOp(72, 810, 9, 'Ion - roman de test'),
    textOp(290, 30, 9, String(number)),
  ];
  let y = BODY.top;
  if (number % 20 === 1) {
    ops.push(textOp(72, 770, 18, `Capitolul ${Math.ceil(number / 20)}`));
  }
  let paragraph = '';
  while (y >= BODY.bottom) {
    if (!paragraph) {
      paragraph = Array.from({ length: 4 }, nextSentence).join(' ');
    }
    const [line, ...rest] = wrap(paragraph, BODY.maxChars);
    ops.push(textOp(72, y, BODY.size, line));
    paragraph = rest.join(' ');
    y -= BODY.leading;
  }
  return winAnsi(ops.join('\n'));
}

/** Adds the catalog and page tree for `pages` (content streams or image pages); returns the root. */
function addPages(pdf, contents, resources) {
  const tree = pdf.reserve();
  const kids = contents.map(content => {
    const stream = pdf.add('<< >>', content);
    return pdf.add(
      `<< /Type /Page /Parent ${tree} 0 R /MediaBox [0 0 ${PAGE.width} ${PAGE.height}] /Resources ${resources} /Contents ${stream} 0 R >>`,
    );
  });
  pdf.set(
    tree,
    `<< /Type /Pages /Kids [${kids.map(k => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`,
  );
  return pdf.add(`<< /Type /Catalog /Pages ${tree} 0 R >>`);
}

/** A text book: running header, page numbers, a larger `Capitolul N` every 20 pages. */
function textBook({ pages, password = null, title, author }) {
  const pdf = createPdf({ password });
  const font = pdf.add(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  );
  let counter = 0;
  const nextSentence = () => sentence((counter += 1));
  const contents = Array.from({ length: pages }, (_, i) =>
    bookPage(i + 1, nextSentence),
  );
  const root = addPages(pdf, contents, `<< /Font << /F1 ${font} 0 R >> >>`);
  // Info strings would need encrypting too; the protected file simply has none
  const info = password
    ? null
    : pdf.add(
        `<< /Title ${literal(title)} /Author ${literal(author)} /Producer (ABook dev-pdfs) >>`,
      );
  return pdf.serialize({ root, info });
}

/** Image-only pages (no text layer), like a scan. */
function scannedBook(pages) {
  const pdf = createPdf();
  const size = { width: 200, height: 260 };
  const pixels = Buffer.alloc(size.width * size.height);
  pixels.forEach((_, i) => {
    pixels[i] = ((i % size.width) ^ Math.floor(i / size.width)) & 0xff;
  });
  const image = pdf.add(
    `<< /Type /XObject /Subtype /Image /Width ${size.width} /Height ${size.height} /ColorSpace /DeviceGray /BitsPerComponent 8 >>`,
    pixels,
  );
  const draw = Buffer.from('q 460 0 0 600 67 120 cm /Im1 Do Q', 'latin1');
  const contents = Array.from({ length: pages }, () => draw);
  const root = addPages(
    pdf,
    contents,
    `<< /XObject << /Im1 ${image} 0 R >> >>`,
  );
  return pdf.serialize({ root });
}

function buildAll() {
  const long = textBook({
    pages: 320,
    title: 'Ion - roman de test',
    author: 'Liviu Rebreanu',
  });
  return {
    'ion-320.pdf': long,
    'protejat-parola-abook.pdf': textBook({ pages: 12, password: 'abook' }),
    'scanat-6.pdf': scannedBook(6),
    'corupt-trunchiat.pdf': long.subarray(0, 30 * 1024),
    'corupt-nu-e-pdf.pdf': Buffer.from(
      'Acesta nu este un PDF.\n'.repeat(200),
      'latin1',
    ),
  };
}

function adb(args) {
  return execFileSync('adb', args, {
    encoding: 'utf8',
    env: { ...process.env, MSYS_NO_PATHCONV: '1' },
  });
}

/** Copies files into the debug app's private directory through /data/local/tmp and run-as. */
function push(files) {
  adb(['shell', 'mkdir', '-p', '/data/local/tmp/abook-dev-pdfs']);
  adb(['shell', 'run-as', APP_ID, 'mkdir', '-p', DEVICE_DIR]);
  for (const file of files) {
    const name = path.basename(file);
    const tmp = `/data/local/tmp/abook-dev-pdfs/${name}`;
    adb(['push', file, tmp]);
    adb(['shell', 'chmod', '644', tmp]);
    adb(['shell', 'run-as', APP_ID, 'cp', tmp, `${DEVICE_DIR}/${name}`]);
    adb(['shell', 'rm', tmp]);
    console.log(`pushed ${name}`);
  }
}

function main(argv) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const written = Object.entries(buildAll()).map(([name, bytes]) => {
    const file = path.join(OUT_DIR, name);
    fs.writeFileSync(file, bytes);
    console.log(`${name}: ${bytes.length} bytes`);
    return file;
  });
  const samples =
    argv.includes('--samples') && fs.existsSync(SAMPLES_DIR)
      ? fs
          .readdirSync(SAMPLES_DIR)
          .filter(n => n.endsWith('.pdf'))
          .map(n => path.join(SAMPLES_DIR, n))
      : [];
  if (argv.includes('--push')) {
    push([...written, ...samples]);
  }
}

if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = {
  buildAll,
  textBook,
  scannedBook,
  wrap,
  sentence,
  winAnsi,
  OUT_DIR,
};
