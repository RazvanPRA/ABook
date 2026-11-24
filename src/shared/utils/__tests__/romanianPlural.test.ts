import { romanianPlural } from '../romanianPlural';

describe('romanianPlural', () => {
  it.each([
    [1, 'one'],
    [0, 'few'],
    [2, 'few'],
    [6, 'few'],
    [19, 'few'],
    [101, 'few'],
    [412, 'few'],
    [20, 'other'],
    [100, 'other'],
    [320, 'other'],
    [522, 'other'],
  ] as const)('%i → %s', (count, form) => {
    expect(romanianPlural(count)).toBe(form);
  });
});
