/**
 * Largest serialized value (UTF-8 bytes) written to one key. AsyncStorage 3.x has no total cap on
 * Android, but a row over ~2 MB fails to read through `CursorWindow`; 256 KB leaves a wide margin.
 */
export const MAX_VALUE_BYTES = 256 * 1024;
