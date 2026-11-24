import React, { useState } from 'react';
import { View } from 'react-native';
import {
  Button,
  ConfirmDialog,
  Fab,
  MenuSheet,
  SearchField,
  Skeleton,
  Snackbar,
} from '@/shared/ui';
import { styles } from '../catalog.styles';
import { CatalogSection } from '../CatalogSection';

type Open = 'menu' | 'dialog' | null;

/** The primitives of M4: search, skeleton, floating button, snackbar, menu and dialog. */
export function OverlaysSection() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Open>(null);
  const close = () => setOpen(null);
  return (
    <CatalogSection title="Căutare, schelet, meniuri">
      <SearchField
        value={query}
        onChangeText={setQuery}
        label="Caută în bibliotecă"
        clearLabel="Șterge căutarea"
      />
      <Skeleton width="60%" height={20} />
      <View style={styles.floatingBox}>
        <Fab label="Importă PDF" icon="plus" onPress={close} />
      </View>
      <View style={styles.floatingBox}>
        <Snackbar
          message="Semn de carte șters"
          action={{ label: 'Anulează', onPress: close }}
        />
      </View>
      <View style={styles.row}>
        <Button label="Meniu" onPress={() => setOpen('menu')} />
        <Button label="Confirmare" onPress={() => setOpen('dialog')} />
      </View>
      <MenuSheet
        visible={open === 'menu'}
        title="Opțiuni"
        items={[
          {
            key: 'delete',
            label: 'Șterge de pe dispozitiv',
            icon: 'trash',
            tone: 'danger',
            onPress: close,
          },
        ]}
        closeLabel="Închide"
        onClose={close}
      />
      <ConfirmDialog
        visible={open === 'dialog'}
        title="Ștergi cartea?"
        lines={['Se eliberează 1,2 MB.', 'Acțiunea nu poate fi anulată.']}
        confirm={{ label: 'Șterge', onPress: close }}
        cancel={{ label: 'Renunță', onPress: close }}
      />
    </CatalogSection>
  );
}
