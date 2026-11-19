import React from 'react';
import { View } from 'react-native';
import {
  AppText,
  BookCover,
  Card,
  Icon,
  ListRow,
  ProgressBar,
} from '@/shared/ui';
import { styles } from '../catalog.styles';
import { CatalogSection } from '../CatalogSection';
import { sample } from '../samples';

export function DisplaySection() {
  return (
    <CatalogSection title="Coperți, progres, rânduri">
      <View style={styles.row}>
        <BookCover
          id={sample.bookId}
          title={sample.title}
          author={sample.author}
          size="lg"
          accessibilityLabel={sample.coverLabel}
        />
        {sample.otherBookIds.map(id => (
          <BookCover key={id} id={id} title={id} accessibilityLabel={id} />
        ))}
      </View>
      <ProgressBar value={0.41} accessibilityLabel="Progres ascultare" />
      <ProgressBar value={1} tone="success" accessibilityLabel="Terminat" />
      <ProgressBar value={0.7} tone="info" accessibilityLabel="Fișiere PDF" />
      <Card padded={false}>
        <ListRow
          title="Partea I"
          tone="muted"
          leading={<Icon name="check" color="success" />}
          trailing={<AppText color="textMuted">p. 1–21</AppText>}
          onPress={() => {}}
        />
        <ListRow
          title={sample.chapter}
          tone="active"
          leading={<Icon name="headphones" color="accent" />}
          trailing={<AppText color="accent">p. 22–43</AppText>}
          onPress={() => {}}
        />
        <ListRow
          title="Partea a III-a"
          divider={false}
          leading={<Icon name="circle" size="sm" color="textMuted" />}
          trailing={<AppText color="textMuted">p. 44–63</AppText>}
          onPress={() => {}}
        />
      </Card>
    </CatalogSection>
  );
}
