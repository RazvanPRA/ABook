import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { createWebViewTransport, loadPdfWebViewHtml } from '@/services/pdf';
import { PdfExtractorHost } from '../PdfExtractorHost';

jest.mock('@/services/pdf/webview/loadPdfWebViewHtml', () => ({
  loadPdfWebViewHtml: jest.fn(async () => '<html>pdf page</html>'),
}));

function setup() {
  const transport = createWebViewTransport();
  const messages: string[] = [];
  const failures: string[] = [];
  transport.listen({
    message: raw => messages.push(raw),
    failure: reason => failures.push(reason),
  });
  return { transport, messages, failures };
}

/** The WebView is hidden from accessibility on purpose. */
const HIDDEN = { includeHiddenElements: true };

/** The jest mock of the WebView (jest.setup.js): its props, plus `posted` for this instance. */
const webView = () => screen.getByTestId('webview', HIDDEN);

beforeEach(() => jest.mocked(loadPdfWebViewHtml).mockClear());

test('renders no WebView until the extractor asks for one', async () => {
  const { transport } = setup();
  await render(<PdfExtractorHost transport={transport} />);
  expect(screen.queryByTestId('webview', HIDDEN)).toBeNull();
  expect(loadPdfWebViewHtml).not.toHaveBeenCalled();
});

test('mounts a hidden WebView with the page HTML and forwards messages both ways', async () => {
  const { transport, messages } = setup();
  await render(<PdfExtractorHost transport={transport} />);
  await act(async () => transport.mount());

  expect(webView().props.source).toEqual({ html: '<html>pdf page</html>' });
  expect(webView().props.originWhitelist).toEqual(['*']);
  transport.post('{"type":"close"}');
  expect(webView().props.posted).toEqual(['{"type":"close"}']);

  await act(async () =>
    webView().props.onMessage({ nativeEvent: { data: '{"type":"ready"}' } }),
  );
  expect(messages).toEqual(['{"type":"ready"}']);
});

test('reports WebView errors and crashes as failures', async () => {
  const { transport, failures } = setup();
  await render(<PdfExtractorHost transport={transport} />);
  await act(async () => transport.mount());
  webView().props.onError({ nativeEvent: { description: 'net::ERR' } });
  webView().props.onRenderProcessGone({ nativeEvent: { didCrash: true } });
  webView().props.onContentProcessDidTerminate({ nativeEvent: {} });
  expect(failures).toEqual([
    'net::ERR',
    'WebView render process gone',
    'WebView content process terminated',
  ]);
});

test('removes the WebView on unmount and starts a fresh one on the next mount', async () => {
  const { transport } = setup();
  await render(<PdfExtractorHost transport={transport} />);
  await act(async () => transport.mount());
  const first = webView().props.posted;

  await act(async () => transport.unmount());
  expect(screen.queryByTestId('webview', HIDDEN)).toBeNull();

  await act(async () => transport.mount());
  expect(webView().props.posted).not.toBe(first);
  expect(loadPdfWebViewHtml).toHaveBeenCalledTimes(1);
});

test('reports a failure when the page HTML cannot be loaded', async () => {
  jest.mocked(loadPdfWebViewHtml).mockRejectedValueOnce(new Error('no module'));
  const { transport, failures } = setup();
  await render(<PdfExtractorHost transport={transport} />);
  await act(async () => transport.mount());
  expect(failures).toEqual(['Error: no module']);
  expect(screen.queryByTestId('webview', HIDDEN)).toBeNull();
});
