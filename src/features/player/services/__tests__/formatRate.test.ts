import { formatRate, RATES } from '../formatRate';

it('keeps at least one decimal', () => {
  expect(RATES.map(formatRate)).toEqual([
    '0.75×',
    '0.9×',
    '1.0×',
    '1.25×',
    '1.5×',
    '2.0×',
  ]);
});
