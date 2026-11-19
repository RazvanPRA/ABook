import { toBookId } from '@/shared/domain';
import { color } from '../colors';
import { pickCoverColor } from '../coverColor';

describe('pickCoverColor', () => {
  it('returns the same color for the same id', () => {
    const id = toBookId('3f1c2d9e-0b7a-4c55-9a1e-6d2f8b4c7e10');
    expect(pickCoverColor(id)).toBe(pickCoverColor(id));
  });

  it('always returns a color from the cover palette', () => {
    expect(color.cover).toContain(pickCoverColor(toBookId('')));
    expect(color.cover).toContain(pickCoverColor(toBookId('ăîșțâ')));
  });

  it('uses every cover color across many ids', () => {
    const used = new Set(
      Array.from({ length: 60 }, (_, i) =>
        pickCoverColor(toBookId(`book-${i}`)),
      ),
    );
    expect(used.size).toBe(color.cover.length);
  });
});
