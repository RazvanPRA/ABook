/* eslint-disable no-bitwise -- base64 is bit manipulation by definition */
// Base64 without Buffer (not in React Native) and without depending on Hermes' atob/btoa.

const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const LOOKUP = new Map([...ALPHABET].map((char, index) => [char, index]));

/** Standard base64 (RFC 4648, with `=` padding) of the bytes. */
export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const triple = (a << 16) | (b << 8) | c;
    const remaining = bytes.length - i;
    out += ALPHABET.charAt((triple >> 18) & 63);
    out += ALPHABET.charAt((triple >> 12) & 63);
    out += remaining > 1 ? ALPHABET.charAt((triple >> 6) & 63) : '=';
    out += remaining > 2 ? ALPHABET.charAt(triple & 63) : '=';
  }
  return out;
}

/**
 * The bytes of a standard base64 string (padding optional, no whitespace). Throws on characters
 * outside the alphabet or an impossible length, instead of silently returning wrong bytes.
 */
export function base64ToBytes(text: string): Uint8Array {
  const data = text.replace(/[=]+$/, '');
  if (data.length % 4 === 1) {
    throw new Error('invalid base64 length');
  }
  const out = new Uint8Array(Math.floor((data.length * 3) / 4));
  let bits = 0;
  let value = 0;
  let index = 0;
  for (const char of data) {
    const digit = LOOKUP.get(char);
    if (digit === undefined) {
      throw new Error(`invalid base64 character ${JSON.stringify(char)}`);
    }
    value = (value << 6) | digit;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[index++] = (value >> bits) & 255;
    }
  }
  return out;
}
