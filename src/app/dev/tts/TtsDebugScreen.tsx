import React from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppText, Button, ScreenHeader } from '@/shared/ui';
import { CatalogSection } from '../CatalogSection';
import { styles } from '../catalog.styles';
import { useTtsProbe } from './useTtsProbe';

/** Dev-only voice check (abook://dev/tts): what the device can speak, and how it reports it. */
export function TtsDebugScreen() {
  const navigation = useNavigation();
  const probe = useTtsProbe();
  return (
    <View style={styles.screen} testID="screen-dev-tts">
      <ScreenHeader
        title="Voce"
        variant="compact"
        overline="M5 · AbookTts"
        back={{
          icon: 'chevron-left',
          accessibilityLabel: 'Înapoi',
          onPress: () => navigation.goBack(),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <ActionsSection probe={probe} />
        <CatalogSection title="Evenimente">
          <AppText testID="tts-log">{probe.log.join('\n')}</AppText>
        </CatalogSection>
        <CatalogSection title={`Voci offline (${probe.voices.length})`}>
          {probe.voices.map(({ id, language, quality }) => (
            <AppText key={id} variant="caption">
              {`${language} · ${id} · ${quality}`}
            </AppText>
          ))}
        </CatalogSection>
      </ScrollView>
    </View>
  );
}

function ActionsSection({ probe }: { probe: ReturnType<typeof useTtsProbe> }) {
  return (
    <CatalogSection title="Fraze">
      <Button label="Română" onPress={() => probe.speak('ro-RO')} />
      <Button label="Engleză" onPress={() => probe.speak('en-US')} />
      <Button label="Engleză 2×" onPress={() => probe.speak('en-US', 2)} />
      <Button label="Stop" variant="secondary" onPress={probe.stop} />
      <Button label="Setări" variant="ghost" onPress={probe.openSettings} />
    </CatalogSection>
  );
}
