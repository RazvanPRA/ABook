import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ByteUnits } from '@/shared/utils';

/** The byte units of `formatBytes`, translated (`format.bytes.*`). */
export function useByteUnits(): ByteUnits {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      B: t('format.bytes.B'),
      KB: t('format.bytes.KB'),
      MB: t('format.bytes.MB'),
      GB: t('format.bytes.GB'),
    }),
    [t],
  );
}
