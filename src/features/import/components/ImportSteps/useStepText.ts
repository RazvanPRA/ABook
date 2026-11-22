import { useTranslation } from 'react-i18next';
import type { ImportStep } from '../../model/types';

/** The texts of a step row: its name (the copy step says when it is done), detail and pages. */
export function useStepText({ id, status, progress }: ImportStep) {
  const { t } = useTranslation();
  const title =
    id === 'copy' && status === 'done'
      ? t('import.steps.copyDone')
      : t(`import.steps.${id}`);
  const detail =
    id === 'copy' && status === 'done' ? t('import.steps.copyDetail') : null;
  const page = progress ? t('import.steps.page', progress) : null;
  const parts = [title, t(`import.steps.status.${status}`)];
  if (progress) {
    parts.push(t('import.steps.pageLabel', progress));
  }
  return { title, detail, page, accessibilityLabel: parts.join(', ') };
}
