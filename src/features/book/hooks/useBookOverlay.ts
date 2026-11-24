import { useCallback, useMemo, useState } from 'react';

export type BookOverlayName = 'menu' | 'delete' | 'restart';

export interface BookOverlay {
  readonly open: BookOverlayName | null;
  readonly show: (name: BookOverlayName) => void;
  readonly hide: () => void;
}

/** Which dialog is over the screen; one at a time. */
export function useBookOverlay(): BookOverlay {
  const [open, setOpen] = useState<BookOverlayName | null>(null);
  const hide = useCallback(() => setOpen(null), []);
  return useMemo(() => ({ open, show: setOpen, hide }), [open, hide]);
}
