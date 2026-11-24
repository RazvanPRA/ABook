import { parseResponse } from '../protocol/parseResponse';
import { EXPECTED_RESPONSE, webViewResponseSchema } from '../protocol/messages';

const page = { page: 3, lines: [{ text: 'Ion', y: 0.2, height: 11 }] };

describe('webViewResponseSchema / parseResponse', () => {
  it.each([
    [
      'ready',
      { type: 'ready', requestId: null, payload: { version: '6.5.438' } },
    ],
    [
      'chunk-loaded',
      {
        type: 'chunk-loaded',
        requestId: 'r1',
        payload: { index: 0, received: 1 },
      },
    ],
    [
      'opened',
      {
        type: 'opened',
        requestId: 'r2',
        payload: { pageCount: 412, title: 'Ion', author: null },
      },
    ],
    ['pages', { type: 'pages', requestId: 'r3', payload: { pages: [page] } }],
    [
      'outline',
      {
        type: 'outline',
        requestId: 'r4',
        payload: {
          items: [
            {
              title: 'Partea întâi',
              page: 3,
              items: [{ title: 'I', page: null, items: [] }],
            },
          ],
        },
      },
    ],
    ['closed', { type: 'closed', requestId: 'r5', payload: {} }],
    [
      'error',
      {
        type: 'error',
        requestId: null,
        payload: { code: 'password', message: 'No password given' },
      },
    ],
  ])('accepts a %s message', (_, message) => {
    expect(parseResponse(JSON.stringify(message))).toEqual(message);
  });

  it.each([
    ['not JSON', '{oops'],
    ['an unknown type', '{"type":"hello","requestId":"r1","payload":{}}'],
    ['a missing requestId', '{"type":"closed","payload":{}}'],
    [
      'a ready message with a requestId',
      '{"type":"ready","requestId":"r1","payload":{"version":"x"}}',
    ],
    [
      'a line outside the page',
      JSON.stringify({
        type: 'pages',
        requestId: 'r1',
        payload: {
          pages: [{ page: 1, lines: [{ text: 'x', y: 1.2, height: 9 }] }],
        },
      }),
    ],
    [
      'page 0',
      JSON.stringify({
        type: 'pages',
        requestId: 'r1',
        payload: { pages: [{ page: 0, lines: [] }] },
      }),
    ],
    [
      'an unknown error code',
      JSON.stringify({
        type: 'error',
        requestId: 'r1',
        payload: { code: 'oops', message: '' },
      }),
    ],
    [
      'an invalid nested outline item',
      JSON.stringify({
        type: 'outline',
        requestId: 'r1',
        payload: { items: [{ title: 'A', page: 1, items: [{ title: 2 }] }] },
      }),
    ],
  ])('rejects %s without throwing, and logs it', (_, raw) => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseResponse(raw)).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('pdf bridge'),
      expect.anything(),
    );
    warn.mockRestore();
  });

  it('maps every request type to a response type the schema knows', () => {
    const types = webViewResponseSchema.options.map(
      option => option.shape.type.value,
    );
    for (const expected of Object.values(EXPECTED_RESPONSE)) {
      expect(types).toContain(expected);
    }
  });
});
