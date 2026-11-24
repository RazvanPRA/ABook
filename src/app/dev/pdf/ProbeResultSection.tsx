import React from 'react';
import { View } from 'react-native';
import { AppText, Button } from '@/shared/ui';
import { CatalogSection } from '../CatalogSection';
import { styles } from '../catalog.styles';
import { removedLines, type ProbeResult } from './runPdfProbe';

function metricsLine(result: ProbeResult): string {
  const { pageCount } = result.document;
  const perSecond = Math.round(
    pageCount / Math.max(result.extractMs / 1000, 0.001),
  );
  const lines = result.rawPages.reduce((sum, p) => sum + p.lines.length, 0);
  return `${pageCount} pagini · ${result.outlineCount} intrări în cuprins · ${result.chapterCount} capitole · deschidere ${result.openMs} ms · extragere ${result.extractMs} ms (${perSecond} pag/s) · lot max ${result.slowestBatchMs} ms · curățare ${result.cleanMs} ms · ${lines} linii · ${result.headerCount} antete`;
}

const leftoversLine = ({ leftoverHeaders }: ProbeResult) =>
  [
    `rămase în benzi după curățare: ${leftoverHeaders.length}`,
    ...leftoverHeaders.map(sig => `· ${sig.slice(0, 40)}`),
  ].join('\n');

const STEPS = [-10, -1, 1, 10];

/** The first 3 kept lines with their position, to tell a running head from a body heading. */
const firstLines = (page: ProbeResult['strippedPages'][number] | undefined) =>
  (page?.lines ?? [])
    .slice(0, 3)
    .map(
      line =>
        `${line.text.slice(0, 50)} (y ${line.y.toFixed(3)}, h ${line.height})`,
    )
    .join(' | ');

/** Speed, cleanup counts and the page stepper of a finished probe. */
export function ProbeResultSection({
  result,
  page,
  onPage,
}: {
  result: ProbeResult;
  page: number;
  onPage: (page: number) => void;
}) {
  const { pageCount, info } = result.document;
  const go = (delta: number) =>
    onPage(Math.min(Math.max(page + delta, 1), pageCount));
  return (
    <CatalogSection title="Rezultat">
      <AppText testID="pdf-metrics">{metricsLine(result)}</AppText>
      <AppText testID="pdf-leftovers">{leftoversLine(result)}</AppText>
      <AppText color="textMuted">
        {`titlu: ${info.title ?? '—'} · autor: ${info.author ?? '—'}`}
      </AppText>
      <View style={styles.row}>
        {STEPS.map(delta => (
          <Button
            key={delta}
            label={delta > 0 ? `+${delta}` : `−${-delta}`}
            variant="secondary"
            onPress={() => go(delta)}
          />
        ))}
        <AppText testID="pdf-page">{`pagina ${page}`}</AppText>
      </View>
      <AppText testID="pdf-removed">
        {`eliminate: ${removedLines(result, page - 1).join(' | ') || '—'}`}
      </AppText>
      <AppText testID="pdf-clean-head">
        {`curățat, primele linii: ${firstLines(result.strippedPages[page - 1])}`}
      </AppText>
    </CatalogSection>
  );
}
