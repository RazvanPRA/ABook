import type { PageLine } from '../../../text';
import type { PdfJsTextItem } from './pdfJsTypes';

// Runs inside the WebView (compiled by scripts/build-pdf-webview.js); no runtime imports.

interface OpenLine {
  text: string;
  baseline: number;
  height: number;
}

/**
 * Groups pdf.js text items into lines, top to bottom as pdf.js returns them. An item starts a new
 * line when its baseline is more than half a font height away from the current line's, or after an
 * item with `hasEOL`. `y` is the baseline's distance from the top as a fraction of the page height,
 * clamped to 0–1; `height` is the font height. Blank lines are dropped.
 */
export function groupLines(
  items: readonly PdfJsTextItem[],
  pageHeight: number,
): PageLine[] {
  const lines: OpenLine[] = [];
  let current: OpenLine | null = null;
  for (const item of items) {
    const baseline = item.transform?.[5];
    if (item.str === undefined || baseline === undefined) {
      continue;
    }
    const height = itemHeight(item);
    if (!continuesLine(current, baseline, height)) {
      current = { text: '', baseline, height };
      lines.push(current);
    }
    appendItem(current, item.str, height);
    current = item.hasEOL ? null : current;
  }
  return lines
    .filter(line => line.text.trim() !== '')
    .map(line => ({
      text: line.text,
      y: toFraction(pageHeight - line.baseline, pageHeight),
      height: line.height,
    }));
}

/** The font height: the transform's vertical scale, else the item's own height. */
function itemHeight(item: PdfJsTextItem): number {
  return Math.abs(item.transform?.[3] ?? 0) || (item.height ?? 0);
}

function continuesLine(
  line: OpenLine | null,
  baseline: number,
  height: number,
): line is OpenLine {
  return line !== null && Math.abs(line.baseline - baseline) <= height / 2;
}

function appendItem(line: OpenLine, text: string, height: number): void {
  line.text += text;
  line.height = Math.max(line.height, height);
}

function toFraction(value: number, total: number): number {
  const fraction = total > 0 ? value / total : 0;
  return Math.min(1, Math.max(0, Math.round(fraction * 1000) / 1000));
}
