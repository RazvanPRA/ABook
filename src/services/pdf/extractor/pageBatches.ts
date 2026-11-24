/** Splits pages `from`–`to` into consecutive ranges of at most `size` pages; `[]` for an empty range. */
export function pageBatches(
  from: number,
  to: number,
  size: number,
): { from: number; to: number }[] {
  const batches = [];
  for (let start = from; start <= to; start += size) {
    batches.push({ from: start, to: Math.min(start + size - 1, to) });
  }
  return batches;
}
