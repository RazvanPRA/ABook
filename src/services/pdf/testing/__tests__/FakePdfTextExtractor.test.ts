import type { PageText } from '@/services/text';
import { isPdfExtractionError } from '../../PdfExtractionError';
import { FakePdfTextExtractor } from '../FakePdfTextExtractor';

const pages = (count: number): PageText[] =>
  Array.from({ length: count }, (_, index) => ({
    page: index + 1,
    lines: [{ text: `Pagina ${index + 1}`, y: 0.5, height: 11 }],
  }));

const codeOf = (promise: Promise<unknown>) =>
  promise.then(
    () => 'resolved',
    (error: unknown) => (isPdfExtractionError(error) ? error.code : 'other'),
  );

describe('FakePdfTextExtractor', () => {
  it('opens a registered PDF and returns its pages and outline', async () => {
    const outline = [{ title: 'Capitolul 1', page: 1, items: [] }];
    const fake = new FakePdfTextExtractor().addPdf('/a.pdf', {
      pages: pages(7),
      title: 'Ion',
      outline,
    });
    await expect(fake.open('/a.pdf')).resolves.toEqual({
      pageCount: 7,
      info: { title: 'Ion', author: null },
    });
    expect(fake.isOpen()).toBe(true);
    expect((await fake.getPages(3, 4)).map(p => p.page)).toEqual([3, 4]);
    await expect(fake.getOutline()).resolves.toEqual(outline);
    expect(fake.calls.map(c => c.call)).toEqual([
      'open',
      'getPages',
      'getOutline',
    ]);
  });

  it('rejects unknown paths as corrupt and registered errors with their code', async () => {
    const fake = new FakePdfTextExtractor().addPdf('/locked.pdf', {
      pages: [],
      openError: 'password',
    });
    await expect(codeOf(fake.open('/none.pdf'))).resolves.toBe('corrupt');
    await expect(codeOf(fake.open('/locked.pdf'))).resolves.toBe('password');
    await expect(codeOf(fake.getPages(1, 1))).resolves.toBe('not-open');
    await expect(codeOf(fake.getOutline())).resolves.toBe('not-open');
  });

  it('times out once a batch reaches failAtPage', async () => {
    const fake = new FakePdfTextExtractor().addPdf('/a.pdf', {
      pages: pages(10),
      failAtPage: 6,
    });
    await fake.open('/a.pdf');
    await expect(codeOf(fake.getPages(1, 5))).resolves.toBe('resolved');
    await expect(codeOf(fake.getPages(6, 10))).resolves.toBe('timeout');
  });

  it('pauses a batch until resume', async () => {
    const fake = new FakePdfTextExtractor().addPdf('/a.pdf', {
      pages: pages(10),
    });
    await fake.open('/a.pdf');
    fake.pauseAtPage(7);
    await expect(codeOf(fake.getPages(1, 5))).resolves.toBe('resolved');
    const paused = fake.getPages(6, 10);
    fake.resume();
    expect((await paused).map(p => p.page)).toEqual([6, 7, 8, 9, 10]);
  });

  it('rejects a paused batch with cancelled on close', async () => {
    const fake = new FakePdfTextExtractor().addPdf('/a.pdf', {
      pages: pages(10),
    });
    await fake.open('/a.pdf');
    fake.pauseAtPage(2);
    const paused = codeOf(fake.getPages(1, 5));
    await fake.close();
    await expect(paused).resolves.toBe('cancelled');
    expect(fake.isOpen()).toBe(false);
  });
});
