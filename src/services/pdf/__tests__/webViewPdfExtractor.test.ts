import {
  createPageTransport,
  pdfJsException,
  readChunkOf,
  sampleBytes,
  type PageTransportOptions,
} from '../__fixtures__/pageTransport';
import { createWebViewPdfExtractor } from '../extractor/createWebViewPdfExtractor';
import { PDF_CHUNK_BYTES } from '../limits';
import { PdfExtractionError } from '../PdfExtractionError';

const PATH = '/books/b1/source.pdf';

function setup(
  bytes = sampleBytes(1000),
  options: PageTransportOptions & { requestMs?: number; bootMs?: number } = {},
) {
  const page = createPageTransport(options);
  const readChunk = readChunkOf(PATH, bytes);
  const extractor = createWebViewPdfExtractor({
    transport: page.transport,
    readChunk,
    timeouts: { requestMs: options.requestMs, bootMs: options.bootMs },
  });
  return { page, readChunk, extractor };
}

const types = (page: ReturnType<typeof createPageTransport>) =>
  page.requests.map(request => request.type);

const rejection = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error('expected a rejection');
    },
    (error: unknown) => {
      if (!(error instanceof PdfExtractionError)) {
        throw error;
      }
      return error.code;
    },
  );

describe('WebViewPdfExtractor.open', () => {
  it('mounts the WebView on the first open, sends the file and returns its info', async () => {
    const { page, extractor } = setup();
    expect(page.state.mounts).toBe(0);
    await expect(extractor.open(PATH)).resolves.toEqual({
      pageCount: 12,
      info: { title: 'Ion', author: 'Liviu Rebreanu' },
    });
    expect(page.state.mounts).toBe(1);
    expect(types(page)).toEqual(['load-chunk', 'open']);
  });

  it('sends a large file in 512 KB chunks the page joins back byte for byte', async () => {
    const bytes = sampleBytes(PDF_CHUNK_BYTES * 2 + 1234);
    const { page, readChunk, extractor } = setup(bytes);
    await extractor.open(PATH);
    expect(types(page)).toEqual([
      'load-chunk',
      'load-chunk',
      'load-chunk',
      'open',
    ]);
    expect(readChunk.calls).toBe(3);
    const [joined] = page.opened;
    expect(joined?.length).toBe(bytes.length);
    expect(joined?.every((byte, index) => byte === bytes[index])).toBe(true);
  });

  it('reads one empty chunk more when the size is an exact multiple of the chunk size', async () => {
    const { page, readChunk, extractor } = setup(sampleBytes(PDF_CHUNK_BYTES));
    await extractor.open(PATH);
    expect(readChunk.calls).toBe(2);
    expect(page.requests.at(-1)).toMatchObject({
      type: 'open',
      payload: { chunkCount: 1, password: null },
    });
  });

  it('rejects an empty file as corrupt without opening it', async () => {
    const { page, extractor } = setup(new Uint8Array(0));
    await expect(rejection(extractor.open(PATH))).resolves.toBe('corrupt');
    expect(types(page)).toEqual([]);
  });

  it('passes a read failure through unchanged', async () => {
    const { extractor } = setup();
    await expect(extractor.open('/missing.pdf')).rejects.toThrow('ENOENT');
  });

  it.each([
    ['PasswordException', 'password'],
    ['InvalidPDFException', 'corrupt'],
    ['FormatError', 'corrupt'],
    ['TypeError', 'unknown'],
  ])('maps pdf.js %s to %s', async (name, code) => {
    const { extractor } = setup(undefined, { openError: pdfJsException(name) });
    await expect(rejection(extractor.open(PATH))).resolves.toBe(code);
  });

  it('boots the WebView once for several documents', async () => {
    const { page, extractor } = setup();
    await extractor.open(PATH);
    await extractor.open(PATH);
    expect(page.state.mounts).toBe(1);
  });
});

describe('WebViewPdfExtractor boot', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('rejects with boot when the page reports a boot error, and remounts on the next open', async () => {
    const { page, extractor } = setup(undefined, { manualBoot: true });
    const first = rejection(extractor.open(PATH));
    page.bootError('import failed');
    await expect(first).resolves.toBe('boot');
    expect(page.state.unmounts).toBe(1);

    const second = extractor.open(PATH);
    page.boot();
    await expect(second).resolves.toMatchObject({ pageCount: 12 });
    expect(page.state.mounts).toBe(2);
  });

  it('rejects with boot when the page never starts', async () => {
    const { page, extractor } = setup(undefined, {
      manualBoot: true,
      bootMs: 5000,
    });
    const opening = rejection(extractor.open(PATH));
    await jest.advanceTimersByTimeAsync(5000);
    await expect(opening).resolves.toBe('boot');
    expect(page.state.mounted).toBe(false);
  });

  it('rejects pending requests with boot when the WebView dies', async () => {
    const { page, extractor } = setup();
    page.hold('load-chunk');
    const opening = rejection(extractor.open(PATH));
    await jest.advanceTimersByTimeAsync(0);
    page.fail('render process gone');
    await expect(opening).resolves.toBe('boot');
    expect(page.state.mounted).toBe(false);
  });
});

describe('WebViewPdfExtractor.getPages', () => {
  it('asks for the pages in batches of 5 and returns them in order', async () => {
    const { page, extractor } = setup();
    await extractor.open(PATH);
    const pages = await extractor.getPages(1, 12);
    expect(pages.map(p => p.page)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect(pages[0]?.lines[0]?.text).toBe('Pagina 1');
    expect(
      page.requests.filter(r => r.type === 'get-pages').map(r => r.payload),
    ).toEqual([
      { from: 1, to: 5 },
      { from: 6, to: 10 },
      { from: 11, to: 12 },
    ]);
  });

  it('returns no pages for an empty range', async () => {
    const { extractor } = setup();
    await extractor.open(PATH);
    await expect(extractor.getPages(3, 2)).resolves.toEqual([]);
  });

  it('rejects with not-open before open and after close, without touching the WebView', async () => {
    const { page, extractor } = setup();
    await expect(rejection(extractor.getPages(1, 5))).resolves.toBe('not-open');
    await extractor.open(PATH);
    await extractor.close();
    await expect(rejection(extractor.getOutline())).resolves.toBe('not-open');
    expect(types(page)).toEqual(['load-chunk', 'open']);
  });

  it('rejects a range past the end with bad-request', async () => {
    const { extractor } = setup();
    await extractor.open(PATH);
    await expect(rejection(extractor.getPages(10, 13))).resolves.toBe(
      'bad-request',
    );
  });

  it('rejects with timeout when the page stops answering', async () => {
    jest.useFakeTimers();
    try {
      const { page, extractor } = setup(undefined, { requestMs: 1000 });
      const opening = extractor.open(PATH);
      await jest.advanceTimersByTimeAsync(0);
      await opening;
      page.hold('get-pages');
      const reading = rejection(extractor.getPages(1, 5));
      await jest.advanceTimersByTimeAsync(1000);
      await expect(reading).resolves.toBe('timeout');
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('WebViewPdfExtractor.close', () => {
  it('cancels a getPages mid-batch, sends no further batch and releases the WebView', async () => {
    const { page, extractor } = setup();
    await extractor.open(PATH);
    page.hold('get-pages');
    const reading = rejection(extractor.getPages(1, 12));
    await Promise.resolve();
    await extractor.close();
    await expect(reading).resolves.toBe('cancelled');
    expect(page.requests.filter(r => r.type === 'get-pages')).toHaveLength(1);
    expect(page.state.mounted).toBe(false);
  });

  it('stops a getPages between batches once a newer open has started', async () => {
    const { page, extractor } = setup();
    await extractor.open(PATH);
    const reading = rejection(extractor.getPages(1, 12));
    const reopening = extractor.open(PATH);
    await expect(reading).resolves.toBe('cancelled');
    await reopening;
    expect(page.requests.filter(r => r.type === 'get-pages')).toHaveLength(1);
  });

  it('cancels an open that is still sending chunks', async () => {
    const { page, extractor } = setup(sampleBytes(PDF_CHUNK_BYTES * 3));
    page.hold('load-chunk');
    const opening = rejection(extractor.open(PATH));
    await new Promise(resolve => setTimeout(resolve, 0));
    await extractor.close();
    await expect(opening).resolves.toBe('cancelled');
    expect(types(page)).toEqual(['load-chunk']);
  });

  it('is harmless before anything was opened', async () => {
    const { page, extractor } = setup();
    await expect(extractor.close()).resolves.toBeUndefined();
    expect(page.state.mounts).toBe(0);
  });
});

describe('WebViewPdfExtractor.getOutline', () => {
  it('returns the outline the page read', async () => {
    const { extractor } = setup();
    await extractor.open(PATH);
    await expect(extractor.getOutline()).resolves.toEqual([
      { title: 'Capitolul 1', page: null, items: [] },
    ]);
  });
});
