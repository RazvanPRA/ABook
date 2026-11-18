/** Stable identifier of an imported book (UUID). Branded so it cannot be mixed with other strings. */
export type BookId = string & { readonly __brand: 'BookId' };

export const toBookId = (value: string): BookId => value as BookId;
