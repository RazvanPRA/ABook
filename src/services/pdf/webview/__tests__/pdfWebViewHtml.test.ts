/**
 * @jest-environment node
 */
/// <reference types="node" />
import fs from 'fs';
import vm from 'vm';

import * as builder from '../../../../../scripts/build-pdf-webview';

describe('the generated WebView page', () => {
  it('is up to date with its sources (run `npm run pdf:webview` if this fails)', () => {
    expect(fs.existsSync(builder.OUTPUT)).toBe(true);
    const generated = fs.readFileSync(builder.OUTPUT, 'utf8');
    const hash = /PDF_WEBVIEW_SOURCE_HASH = '([0-9a-f]{64})'/.exec(
      generated,
    )?.[1];
    expect(hash).toBe(builder.sourceHash());
  });

  describe('its HTML', () => {
    const html = builder.buildHtml();
    const script = /<script>([\s\S]*)<\/script>/.exec(html)?.[1] ?? '';

    it('has a CSP that allows no network access', () => {
      expect(html).toContain(
        "default-src 'none'; script-src 'unsafe-inline' blob:",
      );
      expect(html).not.toMatch(/https?:\/\//);
    });

    it('is one valid script, without imports or exports left', () => {
      expect(() => new vm.Script(script)).not.toThrow();
      expect(script).not.toMatch(/^\s*(import|export)\s/m);
    });

    it('contains the page logic and pdf.js', () => {
      for (const name of [
        'function createRequestHandler',
        'function parseRequest',
        'function groupLines',
        'async function readOutline',
        'const MAX_PAGES_PER_REQUEST',
        'const PDFJS_LIB',
        'const PDFJS_WORKER',
      ]) {
        expect(script).toContain(name);
      }
    });
  });
});
