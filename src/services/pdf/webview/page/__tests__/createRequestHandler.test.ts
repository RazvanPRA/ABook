/**
 * @jest-environment node
 */
/// <reference types="node" />
import { webViewResponseSchema } from '../../../protocol/messages';
import type {
  WebViewRequest,
  WebViewResponse,
} from '../../../protocol/messages';
import { createRequestHandler } from '../createRequestHandler';
import type {
  PdfJsDocument,
  PdfJsLib,
  PdfJsOutlineNode,
  PdfJsPage,
} from '../pdfJsTypes';

const REF_PAGE_3 = { num: 30, gen: 0 };

function fakePage(number: number): PdfJsPage {
  return {
    getViewport: () => ({ height: 800 }),
    getTextContent: async () => ({
      items: [{ str: `Pagina ${number}`, transform: [11, 0, 0, 11, 72, 700] }],
    }),
    cleanup: jest.fn(),
  };
}

function fakeDocument(
  overrides: Partial<PdfJsDocument> = {},
): PdfJsDocument & { destroy: jest.Mock } {
  return {
    numPages: 12,
    getPage: async number => fakePage(number),
    getMetadata: async () => ({
      info: { Title: '  Ion ', Author: 'Liviu Rebreanu', Producer: 'x' },
    }),
    getOutline: async () => null,
    getDestination: async name => (name === 'cap1' ? [REF_PAGE_3] : null),
    getPageIndex: async ref =>
      ref === REF_PAGE_3 ? 2 : Promise.reject(new Error('bad ref')),
    ...overrides,
    destroy: jest.fn(async () => undefined),
  };
}

function exception(name: string, message: string): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

function setup(doc: PdfJsDocument | Error = fakeDocument()) {
  const getDocument = jest.fn(
    (_params: Parameters<PdfJsLib['getDocument']>[0]) => ({
      promise:
        doc instanceof Error ? Promise.reject(doc) : Promise.resolve(doc),
    }),
  );
  const lib: PdfJsLib = { version: '6.5.438', getDocument };
  const decodeBase64 = (data: string) =>
    Uint8Array.from(Buffer.from(data, 'base64'));
  const handle = createRequestHandler({ lib, decodeBase64 });
  let counter = 0;
  const send = async (
    type: WebViewRequest['type'],
    payload: object = {},
  ): Promise<WebViewResponse> => {
    counter += 1;
    const request = {
      type,
      requestId: `r${counter}`,
      payload,
    } as WebViewRequest;
    const response = await handle(request);
    // Whatever the page answers must pass the RN-side validation.
    expect(webViewResponseSchema.safeParse(response).success).toBe(true);
    expect(response.requestId).toBe(request.requestId);
    return response;
  };
  const load = async (...parts: string[]) => {
    for (const [index, part] of parts.entries()) {
      await send('load-chunk', {
        index,
        data: Buffer.from(part).toString('base64'),
      });
    }
    return send('open', { chunkCount: parts.length, password: null });
  };
  return { send, load, getDocument };
}

describe('createRequestHandler', () => {
  it('collects the chunks in order and opens the joined bytes', async () => {
    const { send, getDocument } = setup();
    expect(
      await send('load-chunk', {
        index: 1,
        data: Buffer.from('-1.4').toString('base64'),
      }),
    ).toMatchObject({
      type: 'chunk-loaded',
      payload: { index: 1, received: 1 },
    });
    await send('load-chunk', {
      index: 0,
      data: Buffer.from('%PDF').toString('base64'),
    });
    const opened = await send('open', { chunkCount: 2, password: null });
    expect(opened).toMatchObject({
      type: 'opened',
      payload: { pageCount: 12, title: 'Ion', author: 'Liviu Rebreanu' },
    });
    const [params] = getDocument.mock.calls[0] ?? [];
    expect(Buffer.from(params?.data ?? []).toString()).toBe('%PDF-1.4');
    expect(params).toMatchObject({
      isEvalSupported: false,
      disableFontFace: true,
    });
    expect(params?.password).toBeUndefined();
  });

  it('passes the password', async () => {
    const { send, getDocument } = setup();
    await send('load-chunk', { index: 0, data: 'JVBERg==' });
    await send('open', { chunkCount: 1, password: 'parola' });
    expect(getDocument.mock.calls[0]?.[0].password).toBe('parola');
  });

  it('refuses to open with a missing chunk', async () => {
    const { send } = setup();
    await send('load-chunk', { index: 0, data: 'JVBERg==' });
    expect(await send('open', { chunkCount: 2, password: null })).toMatchObject(
      {
        type: 'error',
        payload: { code: 'bad-request', message: 'chunk 1 of 2 is missing' },
      },
    );
  });

  it('reports missing or unreadable metadata as null', async () => {
    const noInfo = setup(
      fakeDocument({ getMetadata: async () => ({ info: null }) }),
    );
    expect(await noInfo.load('x')).toMatchObject({
      payload: { title: null, author: null },
    });
    const failing = setup(
      fakeDocument({ getMetadata: () => Promise.reject(new Error('no')) }),
    );
    expect(await failing.load('x')).toMatchObject({
      payload: { title: null, author: null },
    });
    const blank = setup(
      fakeDocument({
        getMetadata: async () => ({ info: { Title: '  ', Author: 7 } }),
      }),
    );
    expect(await blank.load('x')).toMatchObject({
      payload: { title: null, author: null },
    });
  });

  it.each([
    ['PasswordException', 'password'],
    ['InvalidPDFException', 'corrupt'],
    ['MissingPDFException', 'corrupt'],
    ['FormatError', 'corrupt'],
    ['TypeError', 'unknown'],
  ])('maps %s to %s', async (name, code) => {
    const { load } = setup(exception(name, 'nope'));
    expect(await load('x')).toMatchObject({
      type: 'error',
      payload: { code, message: 'nope' },
    });
  });

  it('maps a thrown non-error to unknown', async () => {
    const getDocument = () => ({ promise: Promise.reject('just a string') });
    const handle = createRequestHandler({
      lib: { version: 'x', getDocument },
      decodeBase64: () => new Uint8Array(1),
    });
    await handle({
      type: 'load-chunk',
      requestId: 'r1',
      payload: { index: 0, data: '' },
    });
    expect(
      await handle({
        type: 'open',
        requestId: 'r2',
        payload: { chunkCount: 1, password: null },
      }),
    ).toMatchObject({
      type: 'error',
      payload: { code: 'unknown', message: 'just a string' },
    });
  });

  it('returns the lines of the requested pages and cleans each page up', async () => {
    const { send, load } = setup();
    await load('x');
    const response = await send('get-pages', { from: 2, to: 4 });
    expect(response).toMatchObject({
      type: 'pages',
      payload: {
        pages: [
          { page: 2, lines: [{ text: 'Pagina 2', y: 0.125, height: 11 }] },
          { page: 3, lines: [{ text: 'Pagina 3' }] },
          { page: 4, lines: [{ text: 'Pagina 4' }] },
        ],
      },
    });
  });

  it.each([
    [0, 3],
    [11, 13],
    [5, 4],
    [1, 11],
  ])('rejects the page range %p-%p', async (from, to) => {
    const { send, load } = setup();
    await load('x');
    expect(await send('get-pages', { from, to })).toMatchObject({
      type: 'error',
      payload: { code: 'bad-request' },
    });
  });

  it('answers not-open before a document is opened, and after it is closed', async () => {
    const { send, load } = setup();
    expect(await send('get-pages', { from: 1, to: 1 })).toMatchObject({
      payload: { code: 'not-open' },
    });
    expect(await send('get-outline')).toMatchObject({
      payload: { code: 'not-open' },
    });
    await load('x');
    expect(await send('close')).toEqual({
      type: 'closed',
      requestId: 'r5',
      payload: {},
    });
    expect(await send('get-pages', { from: 1, to: 1 })).toMatchObject({
      payload: { code: 'not-open' },
    });
    expect(await send('close')).toMatchObject({ type: 'closed' });
  });

  it('destroys the previous document when opening another one or closing', async () => {
    const doc = fakeDocument();
    const { send, load } = setup(doc);
    await load('a');
    await load('b');
    expect(doc.destroy).toHaveBeenCalledTimes(1);
    await send('close');
    expect(doc.destroy).toHaveBeenCalledTimes(2);
  });

  it('resolves the outline to pages and caps its depth', async () => {
    const deep: PdfJsOutlineNode = {
      title: 'Nivel 1',
      dest: [4],
      items: [
        {
          title: 'Nivel 2',
          dest: [5],
          items: [
            {
              title: 'Nivel 3',
              dest: [6],
              items: [{ title: 'Nivel 4', dest: [7], items: [] }],
            },
          ],
        },
      ],
    };
    const outline: PdfJsOutlineNode[] = [
      { title: 'Numit', dest: 'cap1', items: [] },
      { title: 'Explicit', dest: [REF_PAGE_3, { name: 'XYZ' }], items: [] },
      { title: 'Lipsă', dest: 'nu-există', items: [] },
      { title: 'Fără destinație', dest: null, items: [] },
      { title: 'Referință greșită', dest: [{ num: 99 }], items: [] },
      { title: 'Gol', dest: [], items: [] },
      deep,
    ];
    const { send, load } = setup(
      fakeDocument({ getOutline: async () => outline }),
    );
    await load('x');
    const response = await send('get-outline');
    expect(response).toEqual({
      type: 'outline',
      requestId: 'r3',
      payload: {
        items: [
          { title: 'Numit', page: 3, items: [] },
          { title: 'Explicit', page: 3, items: [] },
          { title: 'Lipsă', page: null, items: [] },
          { title: 'Fără destinație', page: null, items: [] },
          { title: 'Referință greșită', page: null, items: [] },
          { title: 'Gol', page: null, items: [] },
          {
            title: 'Nivel 1',
            page: 5,
            items: [
              {
                title: 'Nivel 2',
                page: 6,
                items: [{ title: 'Nivel 3', page: 7, items: [] }],
              },
            ],
          },
        ],
      },
    });
  });

  it('returns an empty outline when the PDF has none', async () => {
    const { send, load } = setup();
    await load('x');
    expect(await send('get-outline')).toMatchObject({ payload: { items: [] } });
  });
});
