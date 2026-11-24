import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppServices } from '../../providers/ServicesProvider';
import { instrumentTransport, type BridgeTimings } from './instrumentTransport';
import {
  runPdfProbe,
  type ProbeOutcome,
  type ProbeProgress,
} from './runPdfProbe';

/** `files/dev-pdfs`, next to `files/books`; filled by `npm run dev:pdfs -- --push`. */
export const devPdfDir = (booksDir: string) =>
  `${booksDir.slice(0, booksDir.lastIndexOf('/'))}/dev-pdfs`;

/**
 * Dev only: the PDFs in files/dev-pdfs, a probe run over one, and per-request bridge timings.
 * `autoRun` (a file name from the deep link) runs once the file list is known, and again when
 * `nonce` (the link's `run` param) changes: a fast refresh keeps the old result otherwise.
 */
export const usePdfProbe = (autoRun: string | null, nonce: string | null) => {
  const { stores, pdfExtractor, pdfTransport } = useAppServices();
  const dir = devPdfDir(stores.files.booksDir());
  const [files, setFiles] = useState<string[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProbeProgress | null>(null);
  const [outcome, setOutcome] = useState<ProbeOutcome | null>(null);
  const [timings, setTimings] = useState('');
  const phase = useRef('—');
  const meter = useRef<ReturnType<typeof instrumentTransport> | null>(null);
  useEffect(() => {
    meter.current = instrumentTransport(pdfTransport);
    return () => meter.current?.uninstall();
  }, [pdfTransport]);

  useEffect(() => {
    stores.files
      .list(dir)
      .then(names => setFiles(names.filter(n => n.endsWith('.pdf')).sort()));
  }, [dir, stores.files]);

  const onProgress = useCallback((next: ProbeProgress) => {
    phase.current = next.phase === 'pages' ? `pagina ${next.page}` : next.phase;
    setProgress(next);
  }, []);

  const run = useCallback(
    async (name: string) => {
      setRunning(name);
      setOutcome(null);
      setProgress(null);
      meter.current?.reset();
      setOutcome(await runPdfProbe(pdfExtractor, `${dir}/${name}`, onProgress));
      phase.current = 'afișare';
      setTimings(formatTimings(meter.current?.timings ?? {}));
      setRunning(null);
    },
    [dir, pdfExtractor, onProgress],
  );

  const autoRan = useRef<string | null>(null);
  useEffect(() => {
    const key = `${autoRun}|${nonce}`;
    if (autoRun && autoRan.current !== key && files.includes(autoRun)) {
      autoRan.current = key;
      run(autoRun);
    }
  }, [autoRun, nonce, files, run]);

  return { files, running, progress, outcome, timings, phase, run };
};

const formatTimings = (timings: BridgeTimings) =>
  Object.entries(timings)
    .map(
      ([type, t]) =>
        `${type} ×${t.count}: dus-întors ${Math.round(t.roundTripMs / t.count)} ms, post ${Math.round(t.postMs / t.count)} ms, primire ${Math.round(t.receiveMs / t.count)} ms`,
    )
    .join('\n');
