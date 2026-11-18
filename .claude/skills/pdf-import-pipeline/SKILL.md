---
name: pdf-import-pipeline
description: How the Audiobook PDF app imports PDFs offline: pdf.js in a hidden WebView, page-by-page extraction, text cleanup, Romanian sentence segmentation, chapters. Use for import code.
---

# PDF import pipeline

Applies together with `modular-architecture` and `audiobook-storage`.

## Units

- `services/pdf/PdfTextExtractor.ts`: interface `open(uri) -> { pageCount, info }`, `getPage(n) -> PageText`, `getOutline()`, `close()`.
- `services/pdf/WebViewPdfExtractor.ts`: implementation talking to a hidden WebView mounted once by `app/providers/PdfExtractorHost`.
- `services/pdf/webview/`: the HTML + bundled `pdfjs-dist` legacy build (worker inlined). Loaded from a local asset; no network.
- `services/text/*.service.ts`: pure functions, one per file: `stripRepeatedHeaders`, `stripPageNumbers`, `joinHyphenatedWords`, `normalizeDiacritics`, `segmentSentences`, `splitLongSentence`, `detectChapters`.
- `features/import/`: state machine, hooks, screens. It orchestrates; it does not parse.

## Bridge protocol

- Messages are typed `{ type, requestId, payload }` and validated with zod on both sides.
- Send the PDF into the WebView as base64 in chunks (for example 512 KB); never one giant string.
- Request pages in batches of 5; each response is `{ page, lines: { text, y, height }[] }`.
- Every request has a timeout and a cancel path. The WebView has a restricted `originWhitelist` and no external fetch.

## Pipeline

pick -> copy -> open -> extract (batched) -> clean -> segment -> chapter -> save chapter -> ... -> finalize.

- Import state: `idle | copying | opening | extracting(page, total) | saving | ready | failed(reason) | cancelled`.
- Persist `processedPages` so a killed app resumes.
- The first completed chapter is saved immediately, so the book becomes playable before the import finishes.
- Yield between batches (`await`) so the JS thread stays responsive.

## Text rules

- Headers and footers: lines in the top or bottom band of the page that, after replacing digits, repeat on at least 50% of pages.
- Join `cuvân-\ntul` -> `cuvântul` only when the hyphen ends a line and the next line starts lowercase.
- Normalize ş ţ (cedilla) -> ș ț (comma below), and collapse whitespace.
- Sentence split on . ! ? … followed by a space and an uppercase letter or a dialogue dash, but not after Romanian abbreviations (dl., dna., d-na, nr., pag., p., vol., cap., etc., ș.a., ş.a.m.d., prof., dr.) or initials. Keep „…” quotes with their sentence.
- Sentences over ~400 chars are split at ; or , closest to the middle.
- Chapters: the PDF outline first; else headings (short line, larger height, matches `^(Capitolul|Partea|CAPITOLUL|[IVXLC]+\.?)\b`); else every ~10 pages.

## Failure cases

- Scanned PDF: the first 5 pages each have under 20 characters. Stop and explain that a text PDF is needed.
- Password or corrupt: show a clear error and delete the copied file.
- Duplicate: fingerprint = size + SHA-256 of the first 64 KB (`@noble/hashes`); ask before importing a copy.
- Cancel: remove all keys and the file.

## Testing

Every `services/text` function gets table-driven tests with real Romanian samples (dialogue, abbreviations, hyphenation, cedilla diacritics, empty input). Test the import state machine with a fake `PdfTextExtractor`.
