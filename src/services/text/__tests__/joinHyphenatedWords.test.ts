import { line, page, texts } from '../__fixtures__/pages';
import { joinHyphenatedWords } from '../joinHyphenatedWords';
import { charFromCode } from '../letters';

/** Joins the given lines as one page and returns the resulting texts. */
function join(...lines: string[]): string[] {
  const [result = []] = texts(
    joinHyphenatedWords([page(1, ...lines.map(text => line(text)))]),
  );
  return result;
}

describe('joinHyphenatedWords', () => {
  it.each([
    [
      'a word split by a hyphen',
      ['Era un cuvân-', 'tul cel mai frumos.'],
      ['Era un cuvântul', 'cel mai frumos.'],
    ],
    [
      'diacritics on both sides',
      ['Se ducea spre bise-', 'rica din deal.'],
      ['Se ducea spre biserica', 'din deal.'],
    ],
    [
      'punctuation after the moved word',
      ['Ion iubea pămân-', 'tul, mai presus de orice.'],
      ['Ion iubea pământul,', 'mai presus de orice.'],
    ],
    [
      'trailing and leading spaces',
      ['Era o zi fru-  ', '   moasă de vară.'],
      ['Era o zi frumoasă', 'de vară.'],
    ],
    [
      'the soft hyphen',
      [`Venea dimi${charFromCode(0x00ad)}`, 'neața devreme.'],
      ['Venea dimineața', 'devreme.'],
    ],
    [
      'the Unicode hyphen',
      [`Lumea se adu${charFromCode(0x2010)}`, 'nase în curte.'],
      ['Lumea se adunase', 'în curte.'],
    ],
    [
      'the whole next line',
      ['Toți erau acolo, la hora-', 'mare'],
      ['Toți erau acolo, la horamare'],
    ],
  ])('joins %s', (_, input, expected) => {
    expect(join(...input)).toEqual(expected);
  });

  it.each([
    ['s-', 'a dus la târg.', ['Apoi s-a', 'dus la târg.']],
    ['l-', 'am văzut ieri.', ['Apoi l-am', 'văzut ieri.']],
    ['într-', 'o zi de toamnă.', ['Apoi într-o', 'zi de toamnă.']],
    ['dintr-', 'un sat vecin.', ['Apoi dintr-un', 'sat vecin.']],
    ['Printr-', 'o minune scăpă.', ['Apoi Printr-o', 'minune scăpă.']],
  ])('keeps the hyphen of the clitic %p', (fragment, next, expected) => {
    expect(join(`Apoi ${fragment}`, next)).toEqual(expected);
  });

  it.each([
    ['the next line starts with an uppercase letter', ['Era în Nord-', 'Est.']],
    ['the next line starts with a dialogue dash', ['El zise așa-', '— Bine!']],
    ['the next line starts with a digit', ['Pagina a-', '2-a.']],
    ['the line ends with a dash', ['Ea tăcu —', 'apoi plecă.']],
    ['the line ends with an en dash', ['Ea tăcu –', 'apoi plecă.']],
    ['the hyphen follows a space', ['Ea tăcu -', 'apoi plecă.']],
    ['the hyphen is the whole line', ['-', 'apoi plecă.']],
    ['a hyphen in the middle of the line', ['Doamna d-na Ionescu', 'veni.']],
    ['there is no hyphen', ['Era o zi', 'frumoasă.']],
  ])('does nothing when %s', (_, input) => {
    expect(join(...input)).toEqual(input);
  });

  it('joins across a page boundary and keeps the word on the first page', () => {
    const pages = [
      page(12, line('Și atunci se auzi un stri-', 0.8)),
      page(13, line('găt din curte.', 0.15)),
    ];
    const joined = joinHyphenatedWords(pages);
    expect(texts(joined)).toEqual([
      ['Și atunci se auzi un strigăt'],
      ['din curte.'],
    ]);
    expect(joined.map(entry => entry.page)).toEqual([12, 13]);
  });

  it('chains joins through a line emptied by the previous join', () => {
    expect(join('Era ne-', 'maipo-', 'menit de mare.')).toEqual([
      'Era nemaipomenit',
      'de mare.',
    ]);
  });

  it('keeps the position and height of the lines it changes', () => {
    const [first] = joinHyphenatedWords([
      page(1, line('cuvân-', 0.3, 14), line('tul', 0.35)),
    ]);
    expect(first?.lines).toEqual([{ text: 'cuvântul', y: 0.3, height: 14 }]);
  });

  it('drops empty and blank lines, and skips them when joining', () => {
    expect(join('', 'Era un cuvân-', '   ', 'tul.')).toEqual([
      'Era un cuvântul.',
    ]);
  });

  it('handles empty input and empty pages', () => {
    expect(joinHyphenatedWords([])).toEqual([]);
    expect(joinHyphenatedWords([page(3)])).toEqual([page(3)]);
  });

  it('does not mutate its input', () => {
    const pages = [page(1, line('cuvân-'), line('tul'))];
    const copy = JSON.parse(JSON.stringify(pages));
    joinHyphenatedWords(pages);
    expect(pages).toEqual(copy);
  });
});
