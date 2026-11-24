import { deleteBook, resetProgress } from '@/features/book';
import { playerBackgrounded } from '@/features/player';
import {
  bookRemoved,
  bookUpserted,
  progressChanged,
  selectBookProgress,
} from '@/features/library';
import { changeSettings } from '@/features/settings';
import { EN_VOICE } from '@/services/tts/testing';
import {
  playbackRequested,
  toChapterIndex,
  toSentenceIndex,
} from '@/shared/domain';
import { makeProgress } from '@/shared/domain/__fixtures__/progress';
import { A, B, playerApp, sentence, settle } from '../__fixtures__/playerApp';

const AT_1_2 = makeProgress({
  chapter: toChapterIndex(1),
  sentence: toSentenceIndex(2),
});

async function playing(...books: Parameters<typeof playerApp>) {
  const app = await playerApp(...(books.length > 0 ? books : [{}]));
  app.store.dispatch(playbackRequested({ bookId: A }));
  await settle();
  return app;
}

let warn: jest.SpyInstance;
beforeEach(() => {
  jest.useFakeTimers();
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  warn.mockRestore();
  jest.useRealTimers();
});

describe('playbackRequested', () => {
  it('reads a book never played from its beginning', async () => {
    const app = await playing();
    expect(app.tts.speaking).toBe(sentence(0, 0));
    expect(app.session()).toMatchObject({ status: 'playing', bookId: A });
    expect(app.store.getState().player.opening).toBeNull();
  });

  it('goes on where listening stopped', async () => {
    const app = await playing({ progress: AT_1_2 });
    expect(app.tts.speaking).toBe(sentence(1, 2));
  });

  it('starts at the chapter or bookmark asked for', async () => {
    const app = await playerApp({ progress: AT_1_2 });
    app.store.dispatch(
      playbackRequested({
        bookId: A,
        chapter: toChapterIndex(2),
        sentence: toSentenceIndex(1),
      }),
    );
    await settle();
    expect(app.tts.speaking).toBe(sentence(2, 1));
    app.store.dispatch(
      playbackRequested({ bookId: A, chapter: toChapterIndex(0) }),
    );
    await settle();
    expect(app.tts.speaking).toBe(sentence(0, 0));
  });

  it('reads a finished book again from the beginning', async () => {
    const app = await playing({ progress: { ...AT_1_2, finished: true } });
    expect(app.tts.speaking).toBe(sentence(0, 0));
  });

  it('does not start again the book that already plays', async () => {
    const app = await playing();
    app.store.dispatch(playbackRequested({ bookId: A }));
    await settle();
    expect(app.tts.spoken).toHaveLength(1);
  });

  it('the last of two requests wins', async () => {
    const app = await playerApp({}, { id: B });
    app.store.dispatch(playbackRequested({ bookId: A }));
    app.store.dispatch(playbackRequested({ bookId: B }));
    await settle();
    expect(app.session().bookId).toBe(B);
    expect(app.tts.spoken).toHaveLength(1);
  });

  it('ignores a book that does not exist', async () => {
    const app = await playerApp();
    app.store.dispatch(playbackRequested({ bookId: A }));
    await settle();
    expect(app.session().status).toBe('idle');
    expect(app.store.getState().player.opening).toBeNull();
  });

  it('reads one chapter from storage to start', async () => {
    const app = await playerApp({});
    const before = app.kv.calls.length;
    app.store.dispatch(playbackRequested({ bookId: A }));
    await settle();
    const chapterReads = app.kv.calls
      .slice(before)
      .filter(
        ({ operation, keys }) =>
          operation === 'getMany' && keys.some(key => key.includes(':ch:')),
      );
    expect(chapterReads).toHaveLength(1);
  });
});

it('is read in English, whatever language it was imported with', async () => {
  const app = await playing({ meta: { language: 'ro-RO' } });
  expect(app.tts.last?.options).toMatchObject({
    language: 'en-US',
    voiceId: EN_VOICE.id,
  });
});

describe('progress', () => {
  it('is stored at the first sentence, throttled, and shown to the library', async () => {
    const app = await playing();
    expect(await app.stored()).toMatchObject({ chapter: 0, sentence: 0 });
    app.tts.complete();
    await settle();
    expect(await app.stored()).toMatchObject({ sentence: 0 });
    expect(selectBookProgress(app.store.getState(), A)?.sentence).toBe(0);
    await jest.advanceTimersByTimeAsync(3000);
    expect(await app.stored()).toMatchObject({ sentence: 1 });
    expect(selectBookProgress(app.store.getState(), A)?.sentence).toBe(1);
  });

  it.each([
    [
      'pause',
      (app: Awaited<ReturnType<typeof playing>>) => app.notifier.send('pause'),
    ],
    [
      'an interruption',
      (app: Awaited<ReturnType<typeof playing>>) => app.tts.interrupt(),
    ],
    [
      'the app swiped away',
      (app: Awaited<ReturnType<typeof playing>>) => app.notifier.send('stop'),
    ],
    [
      'background',
      (app: Awaited<ReturnType<typeof playing>>) =>
        app.store.dispatch(playerBackgrounded()),
    ],
  ])('%s stores it at once', async (_name, act) => {
    const app = await playing();
    app.tts.complete();
    app.tts.complete();
    act(app);
    await settle();
    expect(await app.stored()).toMatchObject({ chapter: 0, sentence: 2 });
  });

  it('a failed write is tried again at the next sentence', async () => {
    const app = await playerApp({});
    app.kv.failNext('setMany');
    app.store.dispatch(playbackRequested({ bookId: A }));
    await settle();
    expect(await app.stored()).toBeNull();
    app.tts.complete();
    await settle();
    expect(await app.stored()).toMatchObject({ sentence: 1 });
  });

  it('the end marks the book finished', async () => {
    const app = await playing();
    for (let i = 0; i < 12; i += 1) {
      app.tts.complete();
      await settle();
    }
    expect(app.session().status).toBe('ended');
    expect(await app.stored()).toMatchObject({ chapter: 2, finished: true });
  });
});

describe('background', () => {
  it('goes on with background playback, with its notification', async () => {
    const app = await playing();
    await app.store.dispatch(playerBackgrounded());
    expect(app.session().status).toBe('playing');
    expect(app.notifier.shown).toMatchObject({
      text: 'Partea 1',
      playing: true,
      actionLabel: 'Pauză',
    });
    app.notifier.send('pause');
    expect(app.notifier.shown).toMatchObject({
      playing: false,
      actionLabel: 'Redă',
    });
    app.notifier.send('play');
    await settle();
    expect(app.session().status).toBe('playing');
  });

  it('pauses without it, and shows nothing', async () => {
    const app = await playerApp({});
    app.store.dispatch(changeSettings({ backgroundPlayback: false }));
    app.store.dispatch(playbackRequested({ bookId: A }));
    await settle();
    expect(app.notifier.shown).toBeNull();
    await app.store.dispatch(playerBackgrounded());
    expect(app.session().status).toBe('paused');
  });

  it('the notification goes away when it is turned off, or the book ends', async () => {
    const app = await playing();
    app.store.dispatch(changeSettings({ backgroundPlayback: false }));
    expect(app.notifier.shown).toBeNull();
    app.store.dispatch(changeSettings({ backgroundPlayback: true }));
    expect(app.notifier.shown).not.toBeNull();
    await app.store.dispatch(deleteBook(A));
    expect(app.notifier.shown).toBeNull();
  });

  it('does nothing when nothing was played', async () => {
    const app = await playerApp({});
    await app.store.dispatch(playerBackgrounded());
    expect(app.tts.stops).toBe(0);
  });
});

describe('settings', () => {
  it('the rate starts the sentence again; the text size does not', async () => {
    const app = await playing();
    app.store.dispatch(changeSettings({ fontScale: 2 }));
    expect(app.tts.spoken).toHaveLength(1);
    app.store.dispatch(changeSettings({ defaultRate: 1.5 }));
    expect(app.tts.last?.options.rate).toBe(1.5);
    expect(app.tts.spoken).toHaveLength(2);
  });
});

describe('a book deleted', () => {
  it('while it plays leaves no key', async () => {
    const app = await playing();
    app.tts.complete();
    expect(await app.store.dispatch(deleteBook(A))).toBe(true);
    await settle();
    expect(app.keysOf()).toEqual([]);
    expect(app.session().status).toBe('idle');
    expect(app.tts.speaking).toBeNull();
  });

  it('with a write in flight leaves no key', async () => {
    const app = await playing();
    const { saveProgress } = app.services.progressRepository;
    let release = () => {};
    jest
      .spyOn(app.services.progressRepository, 'saveProgress')
      .mockImplementation(async (id, progress) => {
        await new Promise<void>(resolve => (release = resolve));
        return saveProgress(id, progress);
      });
    app.notifier.send('pause');
    await settle();
    const deleting = app.store.dispatch(deleteBook(A));
    await settle();
    release();
    await deleting;
    expect(app.keysOf()).toEqual([]);
  });

  it('can not be played any more, also while it is being opened', async () => {
    const app = await playerApp({});
    app.store.dispatch(playbackRequested({ bookId: A }));
    await app.store.dispatch(deleteBook(A));
    app.store.dispatch(playbackRequested({ bookId: A }));
    await settle();
    expect(app.tts.spoken).toEqual([]);
    expect(app.keysOf()).toEqual([]);
    expect(app.store.getState().player.opening).toBeNull();
  });

  it('behind its back (a cancelled import) leaves no progress', async () => {
    const app = await playing();
    app.store.dispatch(bookRemoved(A));
    await settle();
    expect(app.session().status).toBe('idle');
    expect(app.keysOf().filter(key => key.endsWith('progress'))).toEqual([]);
  });

  it('does not stop the other one', async () => {
    const app = await playing({}, { id: B });
    await app.store.dispatch(deleteBook(B));
    expect(app.tts.speaking).toBe(sentence(0, 0));
  });
});

describe('a book started over while it plays', () => {
  it('forgets where it was, and reads from the beginning', async () => {
    const app = await playing({ progress: AT_1_2 });
    app.tts.complete();
    expect(await app.store.dispatch(resetProgress(A))).toBe(true);
    await settle();
    expect(await app.stored()).toBeNull();
    expect(app.session().status).toBe('idle');
    app.store.dispatch(playbackRequested({ bookId: A }));
    await settle();
    expect(app.tts.speaking).toBe(sentence(0, 0));
    expect(await app.stored()).toMatchObject({ chapter: 0, sentence: 0 });
  });
});

describe('a book still importing', () => {
  it('goes on when its next chapter is saved', async () => {
    const importing = { status: 'processing' as const, processedPages: 2 };
    const app = await playerApp({ meta: importing, chapters: 1 });
    app.store.dispatch(playbackRequested({ bookId: A }));
    await settle();
    // No import runs here, so it is a stalled one
    for (let i = 0; i < 4; i += 1) {
      app.tts.complete();
      await settle();
    }
    expect(app.session()).toMatchObject({ status: 'ended', incomplete: true });
    expect(await app.stored()).toMatchObject({ finished: false });
    await app.saveChapters(A, 2);
    const meta = app.store.getState().library.entities[A];
    if (meta) {
      app.store.dispatch(bookUpserted({ ...meta, processedPages: 4 }));
    }
    await settle();
    expect(app.session()).toMatchObject({
      status: 'paused',
      position: { chapter: 1, sentence: 0 },
    });
  });
});

it('a missing chapter is an error; its text is tried again with the toc', async () => {
  const app = await playerApp({ progress: AT_1_2 });
  jest
    .spyOn(app.services.bookRepository, 'getChapter')
    .mockResolvedValueOnce(null);
  app.store.dispatch(playbackRequested({ bookId: A }));
  await settle();
  expect(app.session()).toMatchObject({ status: 'error', error: 'text' });
  app.store.dispatch(
    playbackRequested({
      bookId: A,
      chapter: toChapterIndex(1),
      sentence: toSentenceIndex(2),
    }),
  );
  await settle();
  expect(app.tts.speaking).toBe(sentence(1, 2));
});

it('progress changed elsewhere does not move what plays', async () => {
  const app = await playing();
  app.store.dispatch(progressChanged({ bookId: A, progress: AT_1_2 }));
  expect(app.session().position).toEqual({ chapter: 0, sentence: 0 });
});
