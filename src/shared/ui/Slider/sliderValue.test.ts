import { fractionOf, snap, stepFrom, valueAt } from './sliderValue';

const RATE = { min: 0.75, max: 2, step: 0.25 };
const PAGES = { min: 1, max: 82, step: 1 };

it.each([
  [1.1, RATE, 1],
  [1.13, RATE, 1.25],
  [9, RATE, 2],
  [-9, RATE, 0.75],
  [0.1 + 0.2, { min: 0, max: 1, step: 0.1 }, 0.3],
  [0.42, { min: 0, max: 1 }, 0.42],
])('%d snaps to %j: %d', (value, range, expected) => {
  expect(snap(value, range)).toBe(expected);
});

it('goes from the place to the value and back', () => {
  expect(valueAt(0, PAGES)).toBe(1);
  expect(valueAt(1.4, PAGES)).toBe(82);
  expect(valueAt(0.5, PAGES)).toBe(42);
  expect(fractionOf(82, PAGES)).toBe(1);
  expect(fractionOf(5, { min: 5, max: 5 })).toBe(0);
});

it('steps inside the range', () => {
  expect(stepFrom(1, 1, PAGES)).toBe(2);
  expect(stepFrom(1, -1, PAGES)).toBe(1);
  expect(stepFrom(0, 1, { min: 0, max: 50 })).toBe(5);
});
