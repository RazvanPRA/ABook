import { useTranslation } from 'react-i18next';
import type { ButtonVariant } from '@/shared/ui';
import type { ImportPhase } from '../../model/types';

export interface NoticeActions {
  onPick: () => void;
  onKeep: () => void;
  onDiscard: () => void;
}

/** What the notice talks about. */
export interface NoticeSubject {
  phase: ImportPhase;
  /** Title of the library book a duplicate matches. */
  existingTitle: string;
  /** A resumed import: what it saved before stays after a failure. */
  resumed: boolean;
}

export interface NoticeAction {
  label: string;
  variant: ButtonVariant;
  onPress: () => void;
}

export interface Notice {
  title: string;
  lines: string[];
  actions: NoticeAction[];
}

/**
 * What the screen says when the import stopped or waits: the failure and that nothing was left
 * behind, a cancel, or a duplicate with the user's two choices. `null` while all goes well.
 */
export function useImportNotice(
  { phase, existingTitle, resumed }: NoticeSubject,
  actions: NoticeActions,
): Notice | null {
  const { t } = useTranslation();
  const retry: NoticeAction = {
    label: t('import.failed.retry'),
    variant: 'secondary',
    onPress: actions.onPick,
  };
  switch (phase.type) {
    case 'failed':
      return {
        title:
          phase.reason === 'scanned'
            ? t('import.scanned.title')
            : t('import.failed.title'),
        lines: [
          t(`import.failed.reasons.${phase.reason}`),
          resumed
            ? t('import.failed.chaptersKept')
            : t('import.failed.nothingLeft'),
        ],
        actions: [retry],
      };
    case 'cancelled':
      return {
        title: t('import.cancelled.title'),
        lines: [t('import.failed.nothingLeft')],
        actions: [retry],
      };
    case 'duplicate':
      return {
        title: t('import.duplicate.title'),
        lines: [t('import.duplicate.detail', { title: existingTitle })],
        actions: [
          {
            label: t('import.duplicate.keep'),
            variant: 'primary',
            onPress: actions.onKeep,
          },
          {
            label: t('import.duplicate.discard'),
            variant: 'ghost',
            onPress: actions.onDiscard,
          },
        ],
      };
    default:
      return null;
  }
}
