import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectImportingBookId } from '@/features/import';
import type { BookMeta } from '@/shared/domain';
import { useByteUnits } from '@/shared/i18n';
import { formatBytes } from '@/shared/utils';

/** What the delete confirmation says: freed space, a running import, that it can't be undone. */
export function useDeleteTexts({ id, title, fileSizeBytes }: BookMeta) {
  const { t } = useTranslation();
  const units = useByteUnits();
  const importing = useSelector(selectImportingBookId) === id;
  return {
    title: t('book.delete.title', { title }),
    lines: [
      t('book.delete.space', { size: formatBytes(fileSizeBytes, units) }),
      ...(importing ? [t('book.delete.importing')] : []),
      t('book.delete.final'),
    ],
  };
}
