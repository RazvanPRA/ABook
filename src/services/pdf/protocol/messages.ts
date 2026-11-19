import { z } from 'zod';
import type { OutlineItem, PageText } from '@/services/text';
import { PAGE_ERROR_CODES } from '../PdfExtractionError';

// The bridge protocol between RN and the WebView page: `{ type, requestId, payload }`.
// Requests are built by RN (typed); responses come from the WebView and are validated here.

type Empty = Record<string, never>;

export type WebViewRequest =
  | {
      type: 'load-chunk';
      requestId: string;
      payload: { index: number; data: string };
    }
  | {
      type: 'open';
      requestId: string;
      payload: { chunkCount: number; password: string | null };
    }
  | {
      type: 'get-pages';
      requestId: string;
      payload: { from: number; to: number };
    }
  | { type: 'get-outline'; requestId: string; payload: Empty }
  | { type: 'close'; requestId: string; payload: Empty };

export type WebViewRequestType = WebViewRequest['type'];

const pageLineSchema = z.object({
  text: z.string(),
  y: z.number().min(0).max(1),
  height: z.number().nonnegative(),
});

export const pageTextSchema = z.object({
  page: z.number().int().min(1),
  lines: z.array(pageLineSchema),
}) satisfies z.ZodType<PageText>;

export const outlineItemSchema: z.ZodType<OutlineItem> = z.lazy(() =>
  z.object({
    title: z.string(),
    page: z.number().int().min(1).nullable(),
    items: z.array(outlineItemSchema),
  }),
);

const reply = <T extends string, P extends z.ZodType>(type: T, payload: P) =>
  z.object({ type: z.literal(type), requestId: z.string(), payload });

export const webViewResponseSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ready'),
    requestId: z.null(),
    payload: z.object({ version: z.string() }),
  }),
  reply(
    'chunk-loaded',
    z.object({
      index: z.number().int().min(0),
      received: z.number().int().min(1),
    }),
  ),
  reply(
    'opened',
    z.object({
      pageCount: z.number().int().min(0),
      title: z.string().nullable(),
      author: z.string().nullable(),
    }),
  ),
  reply('pages', z.object({ pages: z.array(pageTextSchema) })),
  reply('outline', z.object({ items: z.array(outlineItemSchema) })),
  reply('closed', z.object({})),
  z.object({
    type: z.literal('error'),
    requestId: z.string().nullable(),
    payload: z.object({ code: z.enum(PAGE_ERROR_CODES), message: z.string() }),
  }),
]);

export type WebViewResponse = z.infer<typeof webViewResponseSchema>;
export type WebViewResponseType = WebViewResponse['type'];

/** The response a request expects when it succeeds. */
export const EXPECTED_RESPONSE: Readonly<
  Record<WebViewRequestType, WebViewResponseType>
> = {
  'load-chunk': 'chunk-loaded',
  open: 'opened',
  'get-pages': 'pages',
  'get-outline': 'outline',
  close: 'closed',
};
