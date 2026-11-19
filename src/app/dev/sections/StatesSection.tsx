import React from 'react';
import { View } from 'react-native';
import { Card, EmptyState, IconButton, ScreenHeader } from '@/shared/ui';
import { styles } from '../catalog.styles';
import { CatalogSection } from '../CatalogSection';
import { sample } from '../samples';

const noop = () => {};

export function StatesSection() {
  return (
    <CatalogSection title="Header-e și stare goală">
      <Card padded={false}>
        <ScreenHeader
          variant="compact"
          title={sample.title}
          overline={sample.chapter}
          back={{
            icon: 'chevron-down',
            accessibilityLabel: 'Închide playerul',
            onPress: noop,
          }}
          right={
            <IconButton
              icon="bookmark"
              accessibilityLabel="Semn de carte"
              onPress={noop}
            />
          }
        />
      </Card>
      <Card padded={false}>
        <View style={styles.emptyStateBox}>
          <EmptyState
            icon="file-headphone"
            title={sample.empty.title}
            description={sample.empty.description}
            action={{ label: sample.empty.action, icon: 'plus', onPress: noop }}
            note={sample.empty.note}
          />
        </View>
      </Card>
    </CatalogSection>
  );
}
