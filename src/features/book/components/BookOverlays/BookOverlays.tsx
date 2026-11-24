import React from 'react';
import { useTranslation } from 'react-i18next';
import type { BookMeta } from '@/shared/domain';
import { ConfirmDialog, MenuSheet } from '@/shared/ui';
import type { BookOverlay } from '../../hooks/useBookOverlay';
import { useDeleteTexts } from './useDeleteTexts';

interface BookOverlaysProps {
  book: BookMeta;
  overlay: BookOverlay;
  onDelete: () => void;
  onRestart: () => void;
}

/** The "⋯" menu and the confirmations of the delete and of listening again. */
export function BookOverlays({
  book,
  overlay,
  onDelete,
  onRestart,
}: BookOverlaysProps) {
  const { t } = useTranslation();
  const { open, show, hide } = overlay;
  const texts = useDeleteTexts(book);
  const confirmed = (action: () => void) => () => {
    hide();
    action();
  };
  return (
    <>
      <MenuSheet
        visible={open === 'menu'}
        title={t('book.more')}
        items={[
          {
            key: 'delete',
            label: t('book.delete.action'),
            icon: 'trash',
            tone: 'danger',
            onPress: () => show('delete'),
          },
        ]}
        closeLabel={t('book.close')}
        onClose={hide}
      />
      <ConfirmDialog
        visible={open === 'delete'}
        title={texts.title}
        lines={texts.lines}
        confirm={{
          label: t('book.delete.confirm'),
          onPress: confirmed(onDelete),
        }}
        cancel={{ label: t('book.delete.cancel'), onPress: hide }}
      />
      <ConfirmDialog
        visible={open === 'restart'}
        title={t('book.restart.title')}
        lines={[t('book.restart.detail')]}
        confirm={{
          label: t('book.restart.confirm'),
          variant: 'primary',
          onPress: confirmed(onRestart),
        }}
        cancel={{ label: t('book.restart.cancel'), onPress: hide }}
      />
    </>
  );
}
