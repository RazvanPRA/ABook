import { FakePdfTextExtractor } from '@/services/pdf/testing';
import type { PageText } from '@/services/text';
import { pageText, removedLines, runPdfProbe } from '../runPdfProbe';
import { devPdfDir } from '../usePdfProbe';

const book = (count: number): PageText[] =>
  Array.from({ length: count }, (_, index) => ({
    page: index + 1,
    lines: [
      { text: 'Ion - roman de test', y: 0.04, height: 9 },
      { text: `Corpul pag-`, y: 0.5, height: 11 },
      { text: `inii ${index + 1} ﬁnal.`, y: 0.52, height: 11 },
      { text: String(index + 1), y: 0.96, height: 9 },
    ],
  }));

describe('runPdfProbe', () => {
  it('extracts every page, cleans them, reports progress and closes the extractor', async () => {
    const extractor = new FakePdfTextExtractor().addPdf('/d/a.pdf', {
      pages: book(52),
      title: 'Ion',
    });
    const progress = jest.fn();
    const outcome = await runPdfProbe(extractor, '/d/a.pdf', progress);
    if (!outcome.ok) {
      throw new Error(outcome.message);
    }
    const { result } = outcome;
    expect(result.document.pageCount).toBe(52);
    expect(result.rawPages).toHaveLength(52);
    expect(result.headerCount).toBe(2); // the running title and the page number (digits as #)
    expect(result.leftoverHeaders).toEqual([]);
    expect(removedLines(result, 2)).toEqual([
      'Ion - roman de test (y 0.040)',
      '3 (y 0.960)',
    ]);
    expect(pageText(result.cleanPages[2])).toBe('Corpul paginii 3 final.');
    expect(progress.mock.calls.map(([p]) => p.phase)).toEqual([
      'deschidere',
      'pages',
      'pages',
      'curățare',
    ]);
    expect(extractor.calls.at(-1)?.call).toBe('close');
  });

  it('returns the typed error code and still closes the extractor', async () => {
    const extractor = new FakePdfTextExtractor().addPdf('/d/p.pdf', {
      pages: [],
      openError: 'password',
    });
    await expect(
      runPdfProbe(extractor, '/d/p.pdf', jest.fn()),
    ).resolves.toEqual({
      ok: false,
      code: 'password',
      message: 'fake password',
    });
    expect(extractor.calls.at(-1)?.call).toBe('close');
  });

  it('reports a non-PDF failure as other', async () => {
    const extractor = new FakePdfTextExtractor();
    jest.spyOn(extractor, 'open').mockRejectedValue(new Error('ENOENT'));
    await expect(runPdfProbe(extractor, '/x.pdf', jest.fn())).resolves.toEqual({
      ok: false,
      code: 'other',
      message: 'ENOENT',
    });
  });
});

describe('dev PDF helpers', () => {
  it('puts the dev PDFs next to the books directory', () => {
    expect(devPdfDir('/data/files/books')).toBe('/data/files/dev-pdfs');
  });

  it('gives empty text for a missing page', () => {
    expect(pageText(undefined)).toBe('');
  });
});
