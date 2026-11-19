import React, {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { loadPdfWebViewHtml, type WebViewTransport } from '@/services/pdf';

// react-native-webview 14.0.1 declares `WebView<P = undefined>` with props `WebViewProps & P`,
// and `X & undefined` is `never` under strict TS: `WebView<object>` is the workaround, kept here.
type PdfWebViewRef = WebView<object>;

/**
 * The hidden WebView that runs pdf.js, rendered only while the extractor wants it (first `open`
 * until `close`): its first start costs ~2 s and its page is 2.4 MB, so it isn't paid at app start.
 * Each transport session is a fresh WebView (`key`).
 */
export function PdfExtractorHost({
  transport,
}: {
  transport: WebViewTransport;
}) {
  const session = useSyncExternalStore(transport.subscribe, transport.session);
  const html = usePdfWebViewHtml(session !== null, transport);
  if (session === null || html === null) {
    return null;
  }
  return <PdfWebView key={session} html={html} transport={transport} />;
}

/** The page's HTML, loaded the first time a WebView is wanted and kept afterwards. */
function usePdfWebViewHtml(
  wanted: boolean,
  transport: WebViewTransport,
): string | null {
  const [html, setHtml] = useState<string | null>(null);
  const loading = html === null && wanted;
  useEffect(() => {
    if (!loading) {
      return;
    }
    let live = true;
    loadPdfWebViewHtml()
      .then(page => {
        if (live) {
          setHtml(page);
        }
      })
      .catch((error: unknown) => transport.fail(String(error)));
    return () => {
      live = false;
    };
  }, [loading, transport]);
  return html;
}

function PdfWebView({
  html,
  transport,
}: {
  html: string;
  transport: WebViewTransport;
}) {
  const ref = useRef<PdfWebViewRef>(null);
  useEffect(
    () => transport.attach(message => ref.current?.postMessage(message)),
    [transport],
  );
  return (
    <View
      style={styles.hidden}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <WebView<object>
        ref={ref}
        source={{ html }}
        originWhitelist={['*']}
        onMessage={event => transport.receive(event.nativeEvent.data)}
        onError={event => transport.fail(event.nativeEvent.description)}
        onRenderProcessGone={() =>
          transport.fail('WebView render process gone')
        }
        onContentProcessDidTerminate={() =>
          transport.fail('WebView content process terminated')
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Laid out (a WebView with no size may not run), but invisible and outside the touch area
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
