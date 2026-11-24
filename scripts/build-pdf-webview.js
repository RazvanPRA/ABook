/**
 * Builds the WebView page that extracts PDF text (M3 step 7 decision, .claude/plans/M3-import.md):
 * - the page logic is TypeScript in src/services/pdf/webview/page, compiled file by file with
 *   `transpileModule` (no bundler): imports and `export` keywords are stripped, the files are
 *   concatenated in PAGE_FILES order inside one function scope;
 * - pdf.js and its worker (pdfjs-dist legacy, minified) are embedded as base64 and loaded with
 *   `import()` from blob URLs; the worker runs as pdf.js's "fake worker" on the WebView thread,
 *   because a page loaded from an HTML string has an opaque origin and blob Workers are refused;
 * - a CSP allows only the inline scripts and blob modules: no network.
 * Output: src/services/pdf/webview/generated/pdfWebViewHtml.ts (gitignored), with a hash of every
 * input so a test can tell when it is stale. Runs on postinstall and at the start of `npm run check`.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');
const PDF_DIR = path.join(ROOT, 'src/services/pdf');
const PDFJS_DIR = path.join(ROOT, 'node_modules/pdfjs-dist/legacy/build');
const OUTPUT = path.join(PDF_DIR, 'webview/generated/pdfWebViewHtml.ts');

/** Page sources, in dependency order (a file may only use the ones before it). */
const PAGE_FILES = [
  'limits.ts',
  'webview/page/groupLines.ts',
  'webview/page/readOutline.ts',
  'webview/page/parseRequest.ts',
  'webview/page/createRequestHandler.ts',
].map(file => path.join(PDF_DIR, file));

const PDFJS_FILES = ['pdf.min.mjs', 'pdf.worker.min.mjs'].map(file =>
  path.join(PDFJS_DIR, file),
);

const CSP =
  "default-src 'none'; script-src 'unsafe-inline' blob:; style-src 'unsafe-inline'";

/** Wires the page logic to the browser: decoding, loading pdf.js, the message loop. */
const BOOTSTRAP = `
const send = message => window.ReactNativeWebView.postMessage(JSON.stringify(message));
const decodeBase64 = data => {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};
const moduleUrl = data =>
  URL.createObjectURL(new Blob([decodeBase64(data)], { type: 'text/javascript' }));
(async () => {
  let handle;
  try {
    const lib = await import(moduleUrl(PDFJS_LIB));
    globalThis.pdfjsWorker = await import(moduleUrl(PDFJS_WORKER));
    handle = createRequestHandler({ lib, decodeBase64 });
    send({ type: 'ready', requestId: null, payload: { version: lib.version } });
  } catch (error) {
    send({ type: 'error', requestId: null, payload: { code: 'boot', message: String((error && error.message) || error) } });
    return;
  }
  // RN's messages arrive on document or on window depending on the platform: listen on both and
  // handle each request once.
  const seen = new Set();
  const onMessage = event => {
    let value;
    try {
      value = JSON.parse(event.data);
    } catch (error) {
      return;
    }
    const request = parseRequest(value);
    if (!request) {
      const requestId = value && typeof value.requestId === 'string' ? value.requestId : null;
      send({ type: 'error', requestId, payload: { code: 'bad-request', message: 'invalid request' } });
      return;
    }
    if (seen.has(request.requestId)) return;
    seen.add(request.requestId);
    handle(request).then(send);
  };
  window.addEventListener('message', onMessage);
  document.addEventListener('message', onMessage);
})();
`;

function compile(file) {
  const source = fs.readFileSync(file, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      removeComments: true,
    },
    fileName: file,
  });
  return outputText
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^export \{\s*\};?\s*$/gm, '')
    .replace(/^export (?=(async )?function |const |let |class )/gm, '');
}

/** Two page files declaring the same top-level name would silently shadow each other. */
function assertUniqueNames(scripts) {
  const seen = new Map();
  scripts.forEach((script, index) => {
    const pattern =
      /^(?:async function|function|const|let|class) ([A-Za-z_$][\w$]*)/gm;
    for (const [, name] of script.matchAll(pattern)) {
      if (seen.has(name)) {
        throw new Error(
          `${name} is declared in ${PAGE_FILES[seen.get(name)]} and ${PAGE_FILES[index]}`,
        );
      }
      seen.set(name, index);
    }
  });
}

/** Hash of every input of the page, this script included. */
function sourceHash() {
  const hash = crypto.createHash('sha256');
  for (const file of [__filename, ...PAGE_FILES, ...PDFJS_FILES]) {
    hash.update(fs.readFileSync(file));
  }
  return hash.digest('hex');
}

function buildHtml() {
  const scripts = PAGE_FILES.map(compile);
  assertUniqueNames(scripts);
  const [lib, worker] = PDFJS_FILES.map(file =>
    fs.readFileSync(file).toString('base64'),
  );
  const program = [
    `const PDFJS_LIB = "${lib}";`,
    `const PDFJS_WORKER = "${worker}";`,
    ...scripts,
    BOOTSTRAP,
  ].join('\n');
  return [
    '<!doctype html><html><head><meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="${CSP}">`,
    `</head><body><script>(function () {\n'use strict';\n${program}\n})();</script></body></html>`,
  ].join('\n');
}

function main() {
  const html = buildHtml();
  const output = [
    '// GENERATED by scripts/build-pdf-webview.js: do not edit, not committed.',
    `export const PDF_WEBVIEW_SOURCE_HASH = '${sourceHash()}';`,
    `export const PDF_WEBVIEW_HTML = ${JSON.stringify(html)};`,
    '',
  ].join('\n');
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, output);
  const size = (Buffer.byteLength(html) / 1024 / 1024).toFixed(2);
  console.log(`pdf webview: ${path.relative(ROOT, OUTPUT)} (${size} MB)`);
}

module.exports = { OUTPUT, PAGE_FILES, buildHtml, sourceHash };

if (require.main === module) {
  main();
}
