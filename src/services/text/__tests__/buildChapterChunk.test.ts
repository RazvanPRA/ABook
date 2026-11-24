import { chapterChunkSchema, chapterSchema } from '@/shared/domain';
import { BODY_HEIGHT, line, page } from '../__fixtures__/pages';
import { buildChapterChunk } from '../buildChapterChunk';
import { charFromCode } from '../letters';
import { toChapter } from '../toChapter';

const TALL = BODY_HEIGHT * 1.6;

describe('buildChapterChunk', () => {
  it('segments a chapter and gives each sentence the page where it starts', () => {
    const chunk = buildChapterChunk([
      page(
        3,
        line('Capitolul I', 0.15, TALL),
        line('Drumul pornește din șoseaua cea mare. Trece'),
        line('prin Jidovița, apoi coboară.'),
      ),
      page(4, line('Herdelea se uită lung după ei. Ana'), line('tăcea.')),
    ]);
    expect(chunk).toEqual({
      sentences: [
        'Capitolul I',
        'Drumul pornește din șoseaua cea mare.',
        'Trece prin Jidovița, apoi coboară.',
        'Herdelea se uită lung după ei.',
        'Ana tăcea.',
      ],
      sentencePages: [3, 3, 3, 4, 4],
    });
  });

  it('gives a sentence that crosses a page break the page where it starts', () => {
    const chunk = buildChapterChunk([
      page(7, line('Era o zi frumoasă. Toată lumea'), line('venise la horă')),
      page(8, line('în curtea primăriei. Muzica începu.')),
    ]);
    expect(chunk.sentences).toEqual([
      'Era o zi frumoasă.',
      'Toată lumea venise la horă în curtea primăriei.',
      'Muzica începu.',
    ]);
    expect(chunk.sentencePages).toEqual([7, 7, 8]);
  });

  it('joins a word split across pages and normalizes the characters', () => {
    const chunk = buildChapterChunk([
      page(1, line(`${charFromCode(0x015e)}i atunci se auzi un stri-`)),
      page(2, line(`găt  din  ${charFromCode(0xfb01)}nalul curții.`)),
    ]);
    expect(chunk.sentences).toEqual([
      'Și atunci se auzi un strigăt din finalul curții.',
    ]);
    expect(chunk.sentencePages).toEqual([1]);
  });

  it('keeps titles apart even without punctuation', () => {
    const chunk = buildChapterChunk([
      page(
        1,
        line('Partea întâi', 0.1, TALL),
        line('Glasul pământului', 0.15, TALL),
        line('Ion iubea pământul'),
        line('mai mult decât orice'),
      ),
    ]);
    expect(chunk.sentences).toEqual([
      'Partea întâi',
      'Glasul pământului',
      'Ion iubea pământul mai mult decât orice',
    ]);
  });

  it('splits sentences over 400 characters, every part on the start page', () => {
    const long = Array.from(
      { length: 30 },
      (_, i) => `ploua a ${i + 1}-a oară`,
    ).join(', ');
    const chunk = buildChapterChunk([
      page(5, line(`Afară ${long}.`)),
      page(6, line('Apoi se opri.')),
    ]);
    expect(chunk.sentences.length).toBeGreaterThan(2);
    chunk.sentences.forEach(sentence =>
      expect(sentence.length).toBeLessThanOrEqual(400),
    );
    expect(chunk.sentencePages.at(-1)).toBe(6);
    expect(new Set(chunk.sentencePages.slice(0, -1))).toEqual(new Set([5]));
  });

  it('produces a chunk the storage schema accepts', () => {
    const chunk = buildChapterChunk([
      page(1, line('Una. Două.'), line('Trei!')),
    ]);
    expect(chapterChunkSchema.safeParse(chunk).success).toBe(true);
  });

  it.each([
    ['no pages', []],
    ['empty pages', [page(1), page(2)]],
    ['blank lines', [page(1, line('   '), line(charFromCode(0x200b)))]],
  ])('returns an empty chunk for %s', (_, pages) => {
    expect(buildChapterChunk(pages)).toEqual({
      sentences: [],
      sentencePages: [],
    });
  });
});

describe('toChapter', () => {
  it('builds the table-of-contents entry, valid for storage', () => {
    const chunk = buildChapterChunk([page(12, line('Una. Două. Trei.'))]);
    const chapter = toChapter(
      2,
      { title: 'Capitolul III', startPage: 12, endPage: 20 },
      chunk,
    );
    expect(chapter).toEqual({
      index: 2,
      title: 'Capitolul III',
      startPage: 12,
      endPage: 20,
      sentenceCount: 3,
    });
    expect(chapterSchema.safeParse(chapter).success).toBe(true);
  });
});
