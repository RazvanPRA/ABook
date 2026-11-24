import { FakePdfTextExtractor, type FakePdf } from '@/services/pdf/testing';
import { FakePdfPicker } from '@/services/picker/testing';
import type { PageText } from '@/services/text';
import { featureDependencies, type AppServices } from '../dependencies';
import { createAppStore } from '../store';
import { fakeServices } from './fakeServices';

/** `count` pages with enough text to import; chapters fall every 10 pages. */
export const textPages = (count: number): PageText[] =>
  Array.from({ length: count }, (_, i) => ({
    page: i + 1,
    lines: [
      { text: `Ion a mers pe drum la pagina ${i + 1}.`, y: 0.3, height: 11 },
      { text: `Ana privea câmpul de la pagina ${i + 1}.`, y: 0.4, height: 11 },
    ],
  }));

/** The app's store over real repositories, in-memory storage and a fake extractor for every PDF. */
export function fakeApp(pdf: FakePdf = { pages: textPages(30) }) {
  const fakes = fakeServices();
  const extractor = new FakePdfTextExtractor();
  const open = extractor.open.bind(extractor);
  jest.spyOn(extractor, 'open').mockImplementation(path => {
    extractor.addPdf(path, pdf);
    return open(path);
  });
  const services: AppServices = {
    ...fakes.services,
    pdfExtractor: extractor,
    pdfPicker: new FakePdfPicker(),
  };
  return {
    ...fakes,
    services,
    extractor,
    store: createAppStore(featureDependencies(services)),
  };
}
