import { titleFromFileName, usableMetadata } from '../metadata';

describe('usableMetadata', () => {
  it('keeps real values, with whitespace collapsed', () => {
    expect(usableMetadata('  Liviu   Rebreanu ')).toBe('Liviu Rebreanu');
    expect(usableMetadata('Regula dependențelor')).toBe('Regula dependențelor');
  });

  it.each([null, '', '   ', '(anonymous)', 'Unknown', 'untitled'])(
    'drops %p',
    value => {
      expect(usableMetadata(value)).toBeNull();
    },
  );
});

describe('titleFromFileName', () => {
  it('drops the .pdf extension, whatever its case', () => {
    expect(titleFromFileName('ion-rebreanu.pdf')).toBe('ion-rebreanu');
    expect(titleFromFileName('Notițe.PDF')).toBe('Notițe');
    expect(titleFromFileName('fara extensie')).toBe('fara extensie');
  });
});
