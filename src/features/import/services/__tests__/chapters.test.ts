import { book } from '../../__fixtures__/importSetup';
import { createChapterAssembler, type ChapterDraft } from '../chapterAssembler';
import { formPatch } from '../formPatch';
import { planChapters, type ChapterPlan } from '../planChapters';

const ranges = (draft: ChapterDraft | null) =>
  draft && [draft.title, draft.startPage, draft.endPage];

function assemble(plan: ChapterPlan, count: number, headings = {}) {
  const assembler = createChapterAssembler(plan);
  const done = book(count, headings).flatMap(page => {
    const draft = assembler.push(page);
    return draft ? [ranges(draft)] : [];
  });
  return { done, last: ranges(assembler.finish()) };
}

describe('planChapters', () => {
  it('uses the outline when it describes chapters', () => {
    const outline = [
      { title: 'Unu', page: 1, items: [] },
      { title: 'Doi', page: 5, items: [] },
    ];
    expect(planChapters({ outline, pageCount: 8, sample: book(8) })).toEqual({
      kind: 'ranges',
      ranges: [
        { title: 'Unu', startPage: 1, endPage: 4 },
        { title: 'Doi', startPage: 5, endPage: 8 },
      ],
    });
  });

  it('uses headings when the first pages have one, with the body height', () => {
    const sample = book(20, { 3: 'Capitolul I' });
    expect(planChapters({ outline: [], pageCount: 300, sample })).toEqual({
      kind: 'headings',
      bodyHeight: 11,
    });
  });

  it('falls back to a chapter every 10 pages', () => {
    const plan = planChapters({ outline: [], pageCount: 25, sample: book(20) });
    expect(plan.kind === 'ranges' && plan.ranges.length).toBe(3);
  });
});

describe('createChapterAssembler', () => {
  it('closes each range on its last page', () => {
    const plan: ChapterPlan = {
      kind: 'ranges',
      ranges: [
        { title: '', startPage: 1, endPage: 1 },
        { title: 'Unu', startPage: 2, endPage: 4 },
        { title: 'Doi', startPage: 5, endPage: 6 },
      ],
    };
    expect(assemble(plan, 6)).toEqual({
      done: [
        ['', 1, 1],
        ['Unu', 2, 4],
        ['Doi', 5, 6],
      ],
      last: null,
    });
  });

  it('closes a chapter at the next heading and keeps the front matter untitled', () => {
    const plan: ChapterPlan = { kind: 'headings', bodyHeight: 11 };
    expect(assemble(plan, 7, { 3: 'Capitolul I', 6: 'Capitolul II' })).toEqual({
      done: [
        ['', 1, 2],
        ['Capitolul I', 3, 5],
      ],
      last: ['Capitolul II', 6, 7],
    });
  });

  it('titles the first chapter with a heading on page 1, and has nothing left for no pages', () => {
    const plan: ChapterPlan = { kind: 'headings', bodyHeight: 11 };
    expect(assemble(plan, 2, { 1: 'Capitolul I' })).toEqual({
      done: [],
      last: ['Capitolul I', 1, 2],
    });
    expect(createChapterAssembler(plan).finish()).toBeNull();
  });
});

describe('formPatch', () => {
  it('trims the fields and leaves out an empty title', () => {
    expect(formPatch({ title: ' Ion ', author: ' L. R. ' })).toEqual({
      title: 'Ion',
      author: 'L. R.',
    });
    expect(formPatch({ title: '  ', author: '' })).toEqual({
      author: '',
    });
  });
});
