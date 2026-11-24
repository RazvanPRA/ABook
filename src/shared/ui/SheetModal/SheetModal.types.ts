import type { PropsWithChildren } from 'react';

export type SheetModalProps = PropsWithChildren<{
  visible: boolean;
  /** Already translated name of the backdrop that closes the sheet ("Închide"). */
  closeLabel: string;
  onClose: () => void;
}>;
