import React, { useEffect, useRef, useState, type RefObject } from 'react';
import { AppText } from '@/shared/ui';

/** A 50 ms timer on the JS thread: its longest gap shows whether extraction blocks the thread. */
const TICK_MS = 50;

interface Gap {
  readonly ms: number;
  readonly phase: string;
}

/**
 * Dev only. Re-renders only itself, so measuring doesn't load the thread it measures (a first
 * version re-rendered the whole screen every 50 ms and doubled the extraction time).
 * `phase` says what the probe was doing when the longest gap happened.
 */
export function JsTicker({
  active,
  phase,
}: {
  active: boolean;
  phase: RefObject<string>;
}) {
  const [ticks, setTicks] = useState(0);
  const [gap, setGap] = useState<Gap>({ ms: 0, phase: '—' });
  const last = useRef(0);
  useEffect(() => {
    if (!active) {
      return;
    }
    setGap({ ms: 0, phase: '—' });
    last.current = Date.now();
    const timer = setInterval(() => {
      const at = Date.now();
      const ms = at - last.current;
      last.current = at;
      setTicks(count => count + 1);
      setGap(max => (ms > max.ms ? { ms, phase: phase.current } : max));
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [active, phase]);
  return (
    <AppText testID="pdf-ticker">
      {`tic ${ticks} · pauză max JS ${gap.ms} ms (${gap.phase})`}
    </AppText>
  );
}
