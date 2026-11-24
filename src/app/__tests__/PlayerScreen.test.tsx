import { BackHandler } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { deleteBook, selectBookContent } from '@/features/book';
import { RO_VOICE } from '@/services/tts/testing';
import {
  playbackRequested,
  toChapterIndex,
  toPageNumber,
  toSentenceIndex,
  type BookMeta,
} from '@/shared/domain';
import { makeMeta } from '@/shared/domain/__fixtures__/books';
import { makeProgress } from '@/shared/domain/__fixtures__/progress';
import { A, playerApp, sentence, settle } from '../__fixtures__/playerApp';
import { renderPlayerApp } from '../__fixtures__/renderPlayer';

const TITLE = makeMeta(A).title;
const at = (chapter: number, index: number, page: number) =>
  makeProgress({
    chapter: toChapterIndex(chapter),
    sentence: toSentenceIndex(index),
    page: toPageNumber(page),
  });

async function setup(
  given: {
    meta?: Partial<BookMeta>;
    chapters?: number;
    at?: [number, number];
  } = {},
  before: (app: Awaited<ReturnType<typeof playerApp>>) => void = () => {},
) {
  const { at: [chapter, index] = [0, 0], ...book } = given;
  const data = await playerApp(book);
  before(data);
  const app = await renderPlayerApp(data);
  await app.run(() =>
    app.store.dispatch(
      playbackRequested({
        bookId: A,
        chapter: toChapterIndex(chapter),
        sentence: toSentenceIndex(index),
      }),
    ),
  );
  await app.openPlayer();
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

describe('without a book', () => {
  it('says so, leads to the library and keeps the tab bar', async () => {
    const app = await renderPlayerApp(await playerApp());
    await app.openPlayer();
    expect(
      screen.getByRole('header', { name: 'Nicio carte aleasă' }),
    ).toBeOnTheScreen();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    await app.run(() => fireEvent.press(app.button('Mergi la bibliotecă')));
    expect(app.tab()).toBe('Library');
  });

  it('opens the book to continue, paused where it was', async () => {
    const data = await playerApp({ progress: at(1, 2, 4) });
    const app = await renderPlayerApp(data);
    expect(app.session().status).toBe('idle');
    const before = await app.stored();
    await app.openPlayer();
    expect(app.session()).toMatchObject({
      status: 'paused',
      position: { chapter: 1, sentence: 2 },
    });
    expect(app.tts.spoken).toEqual([]);
    expect(await app.stored()).toEqual(before);
    expect(app.button('Redă')).toBeEnabled();
    expect(screen.queryAllByRole('tab')).toEqual([]);
  });
});

describe('reading', () => {
  it('shows the chapter, the book, the page and the text, without the tab bar', async () => {
    await setup({ at: [1, 0] });
    expect(screen.getByText('Partea 2')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: TITLE })).toBeOnTheScreen();
    expect(screen.getByText('Pagina 3')).toBeOnTheScreen();
    expect(screen.getByText(/^~ .* rămase$/)).toBeOnTheScreen();
    expect(screen.getByText(sentence(1, 0))).toBeOnTheScreen();
    expect(screen.queryAllByRole('tab')).toEqual([]);
  });

  it('names an untitled chapter by its number', async () => {
    await setup({ at: [2, 0] });
    expect(screen.getByText('Capitolul 3')).toBeOnTheScreen();
  });

  it('pauses and resumes', async () => {
    const app = await setup();
    await app.run(() => fireEvent.press(app.button('Pauză')));
    expect(app.tts.speaking).toBeNull();
    await app.run(() => fireEvent.press(app.button('Redă')));
    expect(app.tts.speaking).toBe(sentence(0, 0));
  });

  it('moves by sentence and by page', async () => {
    const app = await setup();
    const press = (name: string) =>
      app.run(() => fireEvent.press(app.button(name)));
    await press('Fraza următoare');
    expect(app.tts.speaking).toBe(sentence(0, 1));
    await press('Pagina următoare');
    expect(app.tts.speaking).toBe(sentence(0, 2));
    await press('Pagina anterioară');
    expect(app.tts.speaking).toBe(sentence(0, 0));
    await press('Pagina următoare');
    await press('Fraza anterioară');
    expect(app.tts.speaking).toBe(sentence(0, 1));
  });

  it('stops at the first and at the last page', async () => {
    const app = await setup();
    expect(app.button('Pagina anterioară')).toBeDisabled();
    expect(app.button('Fraza anterioară')).toBeDisabled();
    expect(app.button('Pagina următoare')).toBeEnabled();
    await app.run(() =>
      app.store.dispatch(
        playbackRequested({
          bookId: A,
          chapter: toChapterIndex(2),
          sentence: toSentenceIndex(3),
        }),
      ),
    );
    expect(app.button('Pagina următoare')).toBeDisabled();
    expect(app.button('Fraza următoare')).toBeDisabled();
    expect(app.button('Fraza anterioară')).toBeEnabled();
  });

  it('reads from a tapped sentence', async () => {
    const app = await setup();
    await app.run(() => fireEvent.press(screen.getByText(sentence(0, 3))));
    expect(app.tts.speaking).toBe(sentence(0, 3));
  });

  it('the page slider goes where it is released', async () => {
    const app = await setup();
    const slider = screen.getByLabelText('Pagina');
    expect(slider).toHaveAccessibilityValue({
      min: 1,
      max: 6,
      now: 1,
      text: 'Pagina 1',
    });
    await app.run(() =>
      fireEvent(slider, 'accessibilityAction', {
        nativeEvent: { actionName: 'increment' },
      }),
    );
    expect(app.tts.speaking).toBe(sentence(0, 2));
  });
});

describe('options', () => {
  const choose = async (
    app: Awaited<ReturnType<typeof setup>>,
    name: RegExp,
    item: string,
  ) => {
    await fireEvent.press(screen.getByRole('button', { name }));
    await app.run(() =>
      fireEvent.press(screen.getByRole('menuitem', { name: item })),
    );
  };

  it('the speed applies at once and stays chosen', async () => {
    const app = await setup();
    await choose(app, /^Viteză: 1\.0×$/, '1.5×');
    expect(app.tts.last?.options.rate).toBe(1.5);
    await fireEvent.press(app.button('Viteză: 1.5×'));
    expect(screen.getByRole('menuitem', { name: '1.5×' })).toBeSelected();
  });

  it('the sleep timer shows what is on, and its minutes going by', async () => {
    const app = await setup();
    await choose(app, /^Oprire automată: Oprită$/, '15 minute');
    expect(screen.getByText('15 min')).toBeOnTheScreen();
    await app.run(() => jest.advanceTimersByTime(60_000));
    expect(app.button('Oprire automată: 14 minute')).toBeSelected();
    await choose(app, /^Oprire automată/, 'Sfârșitul capitolului');
    expect(screen.getByText('Capitol')).toBeOnTheScreen();
    await choose(app, /^Oprire automată/, 'Oprită');
    expect(screen.getByText('Somn')).toBeOnTheScreen();
  });

  it('the text size is a setting', async () => {
    const app = await setup();
    await choose(app, /^Mărimea textului: Medie$/, 'Mare');
    expect(app.store.getState().settings.fontScale).toBe(2);
  });
});

describe('bookmarks', () => {
  const marks = (app: Awaited<ReturnType<typeof setup>>) =>
    selectBookContent(app.store.getState(), A)?.bookmarks ?? [];

  it('the header toggles the active sentence', async () => {
    const app = await setup();
    await app.run(() => fireEvent.press(app.button('Adaugă semn de carte')));
    expect(marks(app)).toMatchObject([
      { chapter: 0, sentence: 0, page: 1, excerpt: sentence(0, 0) },
    ]);
    expect(screen.getByText('Semn de carte adăugat')).toBeOnTheScreen();
    expect(app.button('Șterge semnul de carte')).toBeSelected();
    await app.run(() => fireEvent.press(app.button('Șterge semnul de carte')));
    expect(marks(app)).toEqual([]);
    await app.run(() => jest.advanceTimersByTime(4000));
    expect(screen.queryByText('Semn de carte șters')).toBeNull();
  });

  it('a long press adds one; a failed write says so', async () => {
    const app = await setup();
    await app.run(() =>
      fireEvent(screen.getByText(sentence(0, 2)), 'longPress'),
    );
    expect(marks(app)).toMatchObject([{ sentence: 2, page: 2 }]);
    jest
      .spyOn(app.services.progressRepository, 'saveBookmarks')
      .mockRejectedValueOnce(new Error('full'));
    await app.run(() =>
      fireEvent(screen.getByText(sentence(0, 3)), 'longPress'),
    );
    expect(
      screen.getByText('Semnul de carte nu a putut fi salvat'),
    ).toBeOnTheScreen();
    expect(marks(app)).toHaveLength(1);
  });
});

describe('states', () => {
  it('a chapter loading: skeleton, only the chevron works', async () => {
    const app = await setup();
    let answer = () => {};
    jest
      .spyOn(app.services.bookRepository, 'getChapter')
      .mockImplementationOnce(
        () => new Promise(resolve => (answer = () => resolve(null))),
      );
    await app.run(() =>
      app.store.dispatch(
        playbackRequested({ bookId: A, chapter: toChapterIndex(1) }),
      ),
    );
    expect(screen.getByLabelText('Se încarcă textul')).toBeBusy();
    expect(app.button('Redă')).toBeDisabled();
    expect(app.button('Pagina următoare')).toBeDisabled();
    expect(screen.getByLabelText('Pagina')).toBeDisabled();
    expect(app.button('Închide playerul')).toBeEnabled();
    await app.run(answer);
  });

  it('the end of the book, and listening again', async () => {
    const app = await setup({ at: [2, 3] });
    await app.run(() => app.tts.complete());
    expect(
      screen.getByRole('header', { name: 'Ai terminat cartea' }),
    ).toBeOnTheScreen();
    await app.run(() => fireEvent.press(app.button('Ascultă din nou')));
    expect(app.tts.speaking).toBe(sentence(0, 0));
  });

  it('the end of a stopped import leads to the book', async () => {
    const app = await setup({
      meta: { status: 'failed', processedPages: 2 },
      chapters: 1,
      at: [0, 3],
    });
    await app.run(() => app.tts.complete());
    expect(
      screen.getByRole('header', { name: 'Aici se termină textul importat' }),
    ).toBeOnTheScreen();
    await app.run(() => fireEvent.press(app.button('Vezi cartea')));
    expect(app.tab()).toBe('Book');
  });

  it('a failing voice, tried again', async () => {
    const app = await setup();
    await app.run(() => {
      app.tts.fail();
      app.tts.fail();
    });
    expect(
      screen.getByRole('header', { name: 'Vocea nu a pornit' }),
    ).toBeOnTheScreen();
    await app.run(() => fireEvent.press(app.button('Încearcă din nou')));
    expect(app.tts.speaking).toBe(sentence(0, 0));
  });

  it('no English voice: how to install one', async () => {
    const app = await setup({}, ({ tts }) => {
      tts.voices = [RO_VOICE];
    });
    expect(
      screen.getByRole('header', { name: 'Nicio voce în engleză' }),
    ).toBeOnTheScreen();
    expect(screen.getByText(/^Instalează o voce în engleză/)).toBeOnTheScreen();
    expect(app.tts.spoken).toEqual([]);
  });

  it('a chapter that can not be read: again, or the next one', async () => {
    const app = await setup({ at: [1, 0] }, ({ services }) => {
      jest
        .spyOn(services.bookRepository, 'getChapter')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
    });
    const title = { name: 'Capitolul nu poate fi citit' };
    expect(screen.getByRole('header', title)).toBeOnTheScreen();
    await app.run(() => fireEvent.press(app.button('Încearcă din nou')));
    expect(screen.getByRole('header', title)).toBeOnTheScreen();
    await app.run(() =>
      fireEvent.press(app.button('Sari la capitolul următor')),
    );
    expect(app.tts.speaking).toBe(sentence(2, 0));
  });

  it('a replaced voice is told, for a while', async () => {
    const app = await setup({}, ({ store }) => {
      store.dispatch({
        type: 'settings/settingsChanged',
        payload: { voiceId: 'gone' },
      });
    });
    const notice = /Vocea aleasă nu mai e pe telefon/;
    expect(screen.getByText(notice)).toBeOnTheScreen();
    await app.run(() => jest.advanceTimersByTime(6000));
    expect(screen.queryByText(notice)).toBeNull();
  });

  it('the book deleted while its player is open', async () => {
    const app = await setup();
    await app.run(() => app.store.dispatch(deleteBook(A)));
    await app.run(settle);
    expect(
      screen.getByRole('header', { name: 'Nicio carte aleasă' }),
    ).toBeOnTheScreen();
  });
});

describe('leaving', () => {
  it.each(['Biblioteca mea', 'Setări'])(
    'the chevron goes back to the tab it came from (%s)',
    async title => {
      const app = await setup();
      const from = title === 'Setări' ? 'Settings' : 'Library';
      await app.run(() => fireEvent.press(app.button('Închide playerul')));
      const name = title === 'Setări' ? 'Setări' : 'Bibliotecă';
      await app.run(() => fireEvent.press(screen.getByRole('tab', { name })));
      await app.openPlayer();
      await app.run(() => fireEvent.press(app.button('Închide playerul')));
      expect(app.tab()).toBe(from);
      expect(app.tts.speaking).toBe(sentence(0, 0));
    },
  );

  it("Android's back does the same", async () => {
    const listen = jest.spyOn(BackHandler, 'addEventListener');
    const app = await setup();
    const back = listen.mock.calls
      .filter(([event]) => event === 'hardwareBackPress')
      .pop()?.[1];
    await app.run(() => back?.({} as never));
    expect(app.tab()).toBe('Library');
    listen.mockRestore();
  });
});

describe('the mini-player', () => {
  it('is over the other tabs while there is a book, and opens it', async () => {
    const app = await renderPlayerApp(await playerApp({}));
    expect(screen.queryByTestId('mini-player')).toBeNull();
    await app.run(() => app.store.dispatch(playbackRequested({ bookId: A })));
    expect(screen.getByTestId('mini-player')).toBeOnTheScreen();
    expect(screen.getByText('Partea 1')).toBeOnTheScreen();
    await app.run(() =>
      fireEvent.press(screen.getByRole('tab', { name: 'Setări' })),
    );
    expect(screen.getByTestId('mini-player')).toBeOnTheScreen();
    await app.run(() =>
      fireEvent.press(app.button(`Deschide playerul: ${TITLE}`)),
    );
    expect(app.tab()).toBe('Player');
    expect(screen.queryByTestId('mini-player')).toBeNull();
  });

  it('pauses and resumes, stays on an error and goes at the end', async () => {
    const app = await renderPlayerApp(await playerApp({}));
    await app.run(() => app.store.dispatch(playbackRequested({ bookId: A })));
    await app.run(() => fireEvent.press(app.button('Pauză')));
    expect(app.tts.speaking).toBeNull();
    await app.run(() => fireEvent.press(app.button('Redă')));
    expect(app.tts.speaking).toBe(sentence(0, 0));
    await app.run(() => {
      app.tts.fail();
      app.tts.fail();
    });
    expect(screen.getByTestId('mini-player')).toBeOnTheScreen();
    await app.run(() =>
      app.store.dispatch(
        playbackRequested({
          bookId: A,
          chapter: toChapterIndex(2),
          sentence: toSentenceIndex(3),
        }),
      ),
    );
    await app.run(() => app.tts.complete());
    expect(app.session().status).toBe('ended');
    expect(screen.queryByTestId('mini-player')).toBeNull();
  });
});
