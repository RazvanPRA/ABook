import { pickVoice, type TtsError } from '@/services/tts';
import type { ChapterChunk } from '@/shared/domain';
import { nextChapter } from '../position';
import { currentChunk, newToken, report, silence, update } from './core';
import type { SessionCore, SessionError } from './types';

/** How far into a chapter the next one is read ahead. */
const PREFETCH_AT = 0.8;

type OnSentenceDone = (core: SessionCore) => void;

export function fail(core: SessionCore, error: SessionError): void {
  silence(core);
  core.wantsPlay = false;
  core.pausedAt = null;
  update(core, { status: 'error', error, waiting: false });
}

/** Picks the voice of this play; `false` when there is none, which is told in the snapshot. */
async function ensureVoice(core: SessionCore, token: number): Promise<boolean> {
  if (core.voiceId !== undefined || core.book === null) {
    return core.voiceId !== undefined;
  }
  const { language } = core.book;
  try {
    const voices = await core.ports.engine.listVoices();
    if (token !== core.token) {
      return false;
    }
    const savedId = core.ports.settings().voiceId;
    const { voice, replaced } = pickVoice(voices, { savedId, language });
    core.voiceId = voice?.id;
    core.pickedFor = savedId;
    update(core, { voiceReplaced: replaced && voice !== null });
  } catch {
    if (token === core.token) {
      fail(core, 'speech');
    }
    return false;
  }
  if (core.voiceId === undefined) {
    fail(core, 'voice');
  }
  return core.voiceId !== undefined;
}

function prefetchNext(core: SessionCore, chunk: ChapterChunk): void {
  const { position } = core.snapshot;
  if (
    position === null ||
    core.book === null ||
    (position.sentence + 1) / chunk.sentences.length < PREFETCH_AT
  ) {
    return;
  }
  const next = nextChapter(core.book.toc, position.chapter);
  if (next !== null) {
    core.cache?.prefetch(next.index);
  }
}

/** Speaks one sentence; a failure is tried once more before it is reported. */
function speakSentence(
  core: SessionCore,
  text: string,
  attempt: { token: number; first: boolean; onDone: OnSentenceDone },
): void {
  const { token, first, onDone } = attempt;
  const { rate, pitch } = core.ports.settings();
  let startedAt = core.ports.now();
  const guarded =
    <Args extends unknown[]>(run: (...args: Args) => void) =>
    (...args: Args) => {
      if (token === core.token) {
        run(...args);
      }
    };
  core.ports.engine.speak(text, {
    voiceId: core.voiceId ?? null,
    language: core.book?.language ?? '',
    rate,
    pitch,
    onStart: guarded(() => {
      startedAt = core.ports.now();
    }),
    onDone: guarded(() => {
      const milliseconds = core.ports.now() - startedAt;
      core.meter.record({ characters: text.length, milliseconds, rate });
      onDone(core);
    }),
    onError: guarded((error: TtsError) => {
      if (first) {
        speakSentence(core, text, { token, first: false, onDone });
      } else {
        fail(core, error.code === 'language' ? 'voice' : 'speech');
      }
    }),
  });
}

/** Reads the current sentence aloud; its chapter must be loaded. */
export async function startSpeaking(
  core: SessionCore,
  onDone: OnSentenceDone,
): Promise<void> {
  const token = newToken(core);
  core.restoring = false;
  update(core, {
    status: 'playing',
    error: null,
    waiting: false,
    incomplete: false,
  });
  // Synchronous once the voice is known, so quick taps don't interleave
  if (core.voiceId === undefined && !(await ensureVoice(core, token))) {
    return;
  }
  if (token !== core.token) {
    return;
  }
  const chunk = currentChunk(core);
  const text = chunk?.sentences[core.snapshot.position?.sentence ?? -1];
  if (chunk === null || text === undefined) {
    fail(core, 'text');
    return;
  }
  report(core, 'soon');
  prefetchNext(core, chunk);
  speakSentence(core, text, { token, first: true, onDone });
}
