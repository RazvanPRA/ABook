import { utf8ByteLength } from '@/shared/utils';
import { MAX_VALUE_BYTES } from './limits';

/**
 * JSON for one key, refusing anything over `MAX_VALUE_BYTES`. Large values (chapters) are split
 * before they get here, so an oversized value is a programming error, not a user situation.
 */
export const serialize = (key: string, value: unknown): string => {
  const json = JSON.stringify(value);
  const bytes = utf8ByteLength(json);
  if (bytes > MAX_VALUE_BYTES) {
    throw new Error(
      `Value for ${key} is ${bytes} bytes, over the ${MAX_VALUE_BYTES} limit`,
    );
  }
  return json;
};
