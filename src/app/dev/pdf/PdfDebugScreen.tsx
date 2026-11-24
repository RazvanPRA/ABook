import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AppText, Button, ScreenHeader } from '@/shared/ui';
import { CatalogSection } from '../CatalogSection';
import { styles } from '../catalog.styles';
import { JsTicker } from './JsTicker';
import { ProbeResultSection } from './ProbeResultSection';
import { pageText, type ProbeResult } from './runPdfProbe';
import { usePdfProbe } from './usePdfProbe';

type Probe = ReturnType<typeof usePdfProbe>;

/** A string query param of the deep link (`abook://dev/pdf?file=…&page=…`). */
function stringParam(params: object | undefined, key: string): string | null {
  const value: unknown = params ? Reflect.get(params, key) : undefined;
  return typeof value === 'string' && value !== '' ? value : null;
}

/**
 * Dev-only extractor check (abook://dev/pdf): speed, JS-thread gaps, what the cleanup removed.
 * `?file=<name>&page=<n>[&run=<any>]` runs a file and shows a page without tapping (emulator
 * scripts); a new `run` value runs it again.
 */
export function PdfDebugScreen() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const probe = usePdfProbe(
    stringParam(params, 'file'),
    stringParam(params, 'run'),
  );
  const [page, setPage] = useState(1);
  const linkedPage = Number(stringParam(params, 'page') ?? 1);
  useEffect(() => setPage(linkedPage), [linkedPage, probe.outcome]);
  const result = probe.outcome?.ok ? probe.outcome.result : null;
  return (
    <View style={styles.screen} testID="screen-dev-pdf">
      <ScreenHeader
        title="Extragere PDF"
        variant="compact"
        overline="M3 · pdf.js"
        back={{
          icon: 'chevron-left',
          accessibilityLabel: 'Înapoi',
          onPress: () => navigation.goBack(),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <StatusSection probe={probe} />
        {result ? (
          <ProbeResultSection result={result} page={page} onPage={setPage} />
        ) : null}
        <FilesSection probe={probe} />
        {result ? <TextSection result={result} page={page} /> : null}
      </ScrollView>
    </View>
  );
}

function FilesSection({ probe }: { probe: Probe }) {
  return (
    <CatalogSection title="files/dev-pdfs">
      {probe.files.length === 0 ? (
        <AppText color="textMuted">(gol: npm run dev:pdfs -- --push)</AppText>
      ) : null}
      {probe.files.map(name => (
        <Button
          key={name}
          label={name}
          variant="secondary"
          onPress={() => probe.run(name)}
          loading={probe.running === name}
          disabled={probe.running !== null}
        />
      ))}
    </CatalogSection>
  );
}

function statusLine({ running, progress }: Probe): string {
  const pages = progress ? `${progress.page}/${progress.total}` : '—';
  return `${running ?? 'inactiv'} · ${progress?.phase ?? '—'} · pagina ${pages}`;
}

function StatusSection({ probe }: { probe: Probe }) {
  const { outcome } = probe;
  return (
    <CatalogSection title="Stare">
      <AppText testID="pdf-status">{statusLine(probe)}</AppText>
      <JsTicker active={probe.running !== null} phase={probe.phase} />
      <AppText color="textMuted" testID="pdf-timings">
        {probe.timings}
      </AppText>
      {outcome && !outcome.ok ? (
        <AppText color="danger" testID="pdf-error">
          {`eroare ${outcome.code}: ${outcome.message}`}
        </AppText>
      ) : null}
    </CatalogSection>
  );
}

function TextSection({ result, page }: { result: ProbeResult; page: number }) {
  return (
    <CatalogSection title={`Pagina ${page}`}>
      <AppText variant="caption" color="textMuted">
        brut
      </AppText>
      <AppText testID="pdf-raw">{pageText(result.rawPages[page - 1])}</AppText>
      <AppText variant="caption" color="textMuted">
        curățat
      </AppText>
      <AppText testID="pdf-clean">
        {pageText(result.cleanPages[page - 1])}
      </AppText>
    </CatalogSection>
  );
}
