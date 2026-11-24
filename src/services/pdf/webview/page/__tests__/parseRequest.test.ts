import { parseRequest } from '../parseRequest';

describe('parseRequest', () => {
  it.each([
    [
      {
        type: 'load-chunk',
        requestId: 'r1',
        payload: { index: 0, data: 'JVBERi0=' },
      },
    ],
    [
      {
        type: 'open',
        requestId: 'r2',
        payload: { chunkCount: 3, password: null },
      },
    ],
    [
      {
        type: 'open',
        requestId: 'r2',
        payload: { chunkCount: 1, password: 'secret' },
      },
    ],
    [{ type: 'get-pages', requestId: 'r3', payload: { from: 1, to: 5 } }],
    [{ type: 'get-outline', requestId: 'r4', payload: {} }],
    [{ type: 'close', requestId: 'r5', payload: {} }],
  ])('accepts %j', request => {
    expect(parseRequest(request)).toBe(request);
  });

  it.each([
    ['null', null],
    ['a string', 'open'],
    ['an array', []],
    ['a missing type', { requestId: 'r1', payload: {} }],
    ['a numeric requestId', { type: 'close', requestId: 1, payload: {} }],
    ['a missing payload', { type: 'close', requestId: 'r1' }],
    ['an array payload', { type: 'close', requestId: 'r1', payload: [] }],
    ['an unknown type', { type: 'render', requestId: 'r1', payload: {} }],
    [
      'a negative chunk index',
      { type: 'load-chunk', requestId: 'r1', payload: { index: -1, data: '' } },
    ],
    [
      'chunk data that is not a string',
      { type: 'load-chunk', requestId: 'r1', payload: { index: 0, data: 5 } },
    ],
    [
      'a fractional chunk count',
      {
        type: 'open',
        requestId: 'r1',
        payload: { chunkCount: 1.5, password: null },
      },
    ],
    [
      'a numeric password',
      {
        type: 'open',
        requestId: 'r1',
        payload: { chunkCount: 1, password: 1234 },
      },
    ],
    [
      'a page range with a string',
      { type: 'get-pages', requestId: 'r1', payload: { from: '1', to: 5 } },
    ],
  ])('rejects %s', (_, value) => {
    expect(parseRequest(value)).toBeNull();
  });
});
