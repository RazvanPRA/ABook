import { toBookId } from '@/shared/domain';

/**
 * Sample content for the dev-only UI catalog (abook://dev/ui). Not product copy, so it does not go
 * through i18n; it mirrors the texts in .claude/design/*.png for side-by-side comparison.
 */
export const sample = {
  bookId: toBookId('catalog-amintiri'),
  otherBookIds: ['catalog-1', 'catalog-2', 'catalog-3'].map(toBookId),
  title: 'Amintiri din copilărie',
  author: 'Ion Creangă',
  chapter: 'Partea a II-a',
  coverLabel: 'Copertă: Amintiri din copilărie, Ion Creangă',
  metadata: ['82 pagini', '1,2 MB', 'Română', 'Offline'],
  filters: [
    { value: 'all', label: 'Toate' },
    { value: 'reading', label: 'În curs' },
    { value: 'done', label: 'Terminate' },
  ],
  empty: {
    title: 'Încă nu ai nicio carte',
    description:
      'Alege un PDF de pe telefon. Îl copiem în memoria aplicației, extragem textul și ți-l citim cu voce tare — totul offline, nimic nu pleacă de pe dispozitiv.',
    action: 'Importă primul PDF',
    note: 'Funcționează cu PDF-uri cu text. Cele scanate (doar imagini) nu pot fi citite.',
  },
} as const;

export type SampleFilter = (typeof sample.filters)[number]['value'];
