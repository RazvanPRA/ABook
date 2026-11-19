import React from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '@/shared/ui';
import { styles } from './catalog.styles';
import { ButtonsSection } from './sections/ButtonsSection';
import { ControlsSection } from './sections/ControlsSection';
import { DisplaySection } from './sections/DisplaySection';
import { FoundationsSection } from './sections/FoundationsSection';
import { StatesSection } from './sections/StatesSection';

/** Dev-only catalog of every shared/ui primitive (abook://dev/ui), for comparison with the mockups. */
export function UiCatalogScreen() {
  const navigation = useNavigation();
  return (
    <View style={styles.screen} testID="screen-dev-ui">
      <ScreenHeader
        title="Catalog UI"
        variant="compact"
        overline="M1 · design system"
        back={{
          icon: 'chevron-left',
          accessibilityLabel: 'Înapoi',
          onPress: () => navigation.goBack(),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <FoundationsSection />
        <ButtonsSection />
        <ControlsSection />
        <DisplaySection />
        <StatesSection />
      </ScrollView>
    </View>
  );
}
