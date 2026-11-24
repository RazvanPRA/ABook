import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, ScreenHeader } from '@/shared/ui';

interface BookHeaderProps {
  onBack: () => void;
  /** Without it there is no "⋯" (nothing to act on). */
  onMore?: () => void;
}

/** Back and "⋯"; the title is the screen's own, under the cover. */
export function BookHeader({ onBack, onMore }: BookHeaderProps) {
  const { t } = useTranslation();
  return (
    <ScreenHeader
      title=""
      variant="compact"
      back={{
        icon: 'chevron-left',
        accessibilityLabel: t('book.back'),
        onPress: onBack,
      }}
      right={
        onMore ? (
          <IconButton
            icon="more-horizontal"
            accessibilityLabel={t('book.more')}
            onPress={onMore}
          />
        ) : undefined
      }
    />
  );
}
