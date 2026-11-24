import { useTranslation } from 'react-i18next';
import type { BookMeta } from '@/shared/domain';
import { useByteUnits } from '@/shared/i18n';
import { romanianPlural } from '@/shared/utils';
import { formatBookMeta } from '../../services/formatBookMeta';

/** The translated metadata chips of a book. */
export function useBookMetaChips(book: BookMeta): string[] {
  const { t } = useTranslation();
  const bytes = useByteUnits();
  return formatBookMeta(book, {
    pages: count => t(`format.pages.${romanianPlural(count)}`, { count }),
    bytes,
    languages: {
      'ro-RO': t('book.languages.ro-RO'),
      'en-US': t('book.languages.en-US'),
    },
    offline: t('book.offline'),
  });
}
