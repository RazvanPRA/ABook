import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton } from '@/shared/ui';
import { styles } from '../catalog.styles';
import { CatalogSection } from '../CatalogSection';

const noop = () => {};

export function ButtonsSection() {
  const [playing, setPlaying] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  return (
    <CatalogSection title="Butoane">
      <Button
        label="Continuă de la pagina 34"
        icon="play"
        size="lg"
        onPress={noop}
      />
      <View style={styles.row}>
        <Button label="Primar" onPress={noop} />
        <Button
          label="Secundar"
          variant="secondary"
          icon="moon"
          onPress={noop}
        />
        <Button label="Ascultă o mostră" variant="ghost" onPress={noop} />
      </View>
      <View style={styles.row}>
        <Button
          label="Șterge de pe dispozitiv"
          variant="danger"
          icon="trash"
          onPress={noop}
        />
        <Button label="Se încarcă" loading onPress={noop} />
        <Button label="Dezactivat" disabled onPress={noop} />
      </View>
      <View style={styles.row}>
        <IconButton
          icon="skip-back"
          accessibilityLabel="Pagina anterioară"
          onPress={noop}
        />
        <IconButton
          icon="rotate-ccw"
          accessibilityLabel="Fraza anterioară"
          onPress={noop}
        />
        <IconButton
          icon={playing ? 'pause' : 'play'}
          variant="filled"
          accessibilityLabel={playing ? 'Pauză' : 'Redă'}
          onPress={() => setPlaying(p => !p)}
        />
        <IconButton
          icon="rotate-cw"
          accessibilityLabel="Fraza următoare"
          onPress={noop}
        />
        <IconButton
          icon="skip-forward"
          accessibilityLabel="Pagina următoare"
          onPress={noop}
        />
      </View>
      <View style={styles.row}>
        <IconButton
          icon="bookmark"
          active={bookmarked}
          accessibilityLabel="Semn de carte"
          onPress={() => setBookmarked(b => !b)}
        />
        <IconButton
          icon="more-horizontal"
          accessibilityLabel="Mai multe"
          onPress={noop}
        />
        <IconButton
          icon="x"
          accessibilityLabel="Dezactivat"
          disabled
          onPress={noop}
        />
      </View>
    </CatalogSection>
  );
}
