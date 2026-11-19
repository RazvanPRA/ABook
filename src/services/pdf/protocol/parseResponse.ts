import { z } from 'zod';
import { logger } from '@/shared/utils';
import { type WebViewResponse, webViewResponseSchema } from './messages';

/**
 * A message from the WebView, validated; `null` (logged) when it isn't JSON or doesn't match the
 * protocol. Never throws: a bad message must not crash the import.
 */
export function parseResponse(raw: string): WebViewResponse | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    logger.warn('pdf bridge: message is not JSON', raw.slice(0, 80));
    return null;
  }
  const result = webViewResponseSchema.safeParse(value);
  if (!result.success) {
    logger.warn('pdf bridge: invalid message', z.prettifyError(result.error));
    return null;
  }
  return result.data;
}
