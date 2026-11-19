import type { OutlineItem } from '../../../text';
import type { PdfJsDocument, PdfJsOutlineNode } from './pdfJsTypes';

// Runs inside the WebView (compiled by scripts/build-pdf-webview.js); no runtime imports.

/** Outline levels kept: chapters use at most the first two (services/text/chaptersFromOutline). */
export const MAX_OUTLINE_DEPTH = 3;

/**
 * The PDF outline with each destination resolved to a 1-based page (`null` when it can't be
 * resolved: a missing named destination, an external link). Levels below `MAX_OUTLINE_DEPTH` are
 * dropped to keep the message small.
 */
export async function readOutline(
  doc: PdfJsDocument,
  nodes: readonly PdfJsOutlineNode[],
  depth = 1,
): Promise<OutlineItem[]> {
  const items: OutlineItem[] = [];
  for (const node of nodes) {
    items.push({
      title: node.title,
      page: await resolvePage(doc, node.dest),
      items:
        depth < MAX_OUTLINE_DEPTH
          ? await readOutline(doc, node.items, depth + 1)
          : [],
    });
  }
  return items;
}

async function resolvePage(
  doc: PdfJsDocument,
  dest: PdfJsOutlineNode['dest'],
): Promise<number | null> {
  try {
    const explicit =
      typeof dest === 'string' ? await doc.getDestination(dest) : dest;
    const target = explicit?.[0];
    if (target === undefined || target === null) {
      return null;
    }
    const index =
      typeof target === 'number' ? target : await doc.getPageIndex(target);
    return index + 1;
  } catch {
    return null;
  }
}
