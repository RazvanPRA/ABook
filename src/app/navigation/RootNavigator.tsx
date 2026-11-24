import React, { useCallback } from 'react';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { BookScreen } from '@/features/book';
import { ImportScreen } from '@/features/import';
import { bookIdSchema } from '@/shared/domain';
import { PdfDebugScreen } from '../dev/pdf/PdfDebugScreen';
import { StorageDebugScreen } from '../dev/storage/StorageDebugScreen';
import { TtsDebugScreen } from '../dev/tts/TtsDebugScreen';
import { UiCatalogScreen } from '../dev/UiCatalogScreen';
import { TabsNavigator } from './TabsNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Adapts the route param to the feature screen's own props (features do not import navigation
 * types). The id may come from a link, so a malformed one is a book that doesn't exist.
 */
function BookRoute({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Book'>) {
  const { data: bookId = null } = bookIdSchema.safeParse(route.params.id);
  const toLibrary = useCallback(
    () => navigation.popTo('Tabs', { screen: 'Library' }),
    [navigation],
  );
  const toPlayer = useCallback(
    () => navigation.popTo('Tabs', { screen: 'Player' }),
    [navigation],
  );
  return (
    <BookScreen
      bookId={bookId}
      onBack={navigation.goBack}
      onLibrary={toLibrary}
      onPlay={toPlayer}
    />
  );
}

function ImportRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Import'>) {
  return <ImportScreen onClose={navigation.goBack} />;
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabsNavigator} />
      <Stack.Screen
        name="Import"
        component={ImportRoute}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="Book" component={BookRoute} />
      {__DEV__ ? (
        <>
          <Stack.Screen name="DevUi" component={UiCatalogScreen} />
          <Stack.Screen name="DevStorage" component={StorageDebugScreen} />
          <Stack.Screen name="DevPdf" component={PdfDebugScreen} />
          <Stack.Screen name="DevTts" component={TtsDebugScreen} />
        </>
      ) : null}
    </Stack.Navigator>
  );
}
