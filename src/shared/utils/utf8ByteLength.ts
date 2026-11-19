const ONE_BYTE_LIMIT = 0x80;
const TWO_BYTE_LIMIT = 0x800;
const HIGH_SURROGATE_START = 0xd800;
const HIGH_SURROGATE_END = 0xdbff;
const LOW_SURROGATE_START = 0xdc00;
const LOW_SURROGATE_END = 0xdfff;

const isLowSurrogate = (code: number): boolean =>
  code >= LOW_SURROGATE_START && code <= LOW_SURROGATE_END;

/**
 * Size of `value` once encoded as UTF-8, without relying on `TextEncoder` (not guaranteed in Hermes).
 * Romanian diacritics take 2 bytes, so `string.length` underestimates storage size.
 * A lone surrogate counts as 3 bytes, the size of the U+FFFD that replaces it.
 */
export const utf8ByteLength = (value: string): number => {
  let bytes = 0;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < ONE_BYTE_LIMIT) {
      bytes += 1;
    } else if (code < TWO_BYTE_LIMIT) {
      bytes += 2;
    } else if (
      code >= HIGH_SURROGATE_START &&
      code <= HIGH_SURROGATE_END &&
      isLowSurrogate(value.charCodeAt(i + 1))
    ) {
      bytes += 4;
      i += 1;
    } else {
      bytes += 3;
    }
  }
  return bytes;
};
