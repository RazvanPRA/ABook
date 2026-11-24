import { BOOK_IDS } from '@/shared/domain/__fixtures__/books';
import { createBookRelease } from '../createBookRelease';

const [A] = BOOK_IDS as [(typeof BOOK_IDS)[number]];

it('waits for every handler', async () => {
  const release = createBookRelease();
  const order: string[] = [];
  release.onRelease(async (id, reason) => {
    await Promise.resolve();
    order.push(`${id} ${reason}`);
  });
  await release.release(A, 'deleted');
  expect(order).toEqual([`${A} deleted`]);
});

it('asks nobody after the unregister', async () => {
  const release = createBookRelease();
  const handler = jest.fn(async () => {});
  release.onRelease(handler)();
  await release.release(A, 'restarted');
  expect(handler).not.toHaveBeenCalled();
});
