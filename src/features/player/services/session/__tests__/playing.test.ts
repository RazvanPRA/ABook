import { sentenceText as s } from '../../../__fixtures__/chapters';
import {
  CHAPTERS,
  makeBook,
  settle,
  setupSession,
} from '../../../__fixtures__/sessionSetup';

const RO_ID = 'ro-1';

async function readAll(setup: ReturnType<typeof setupSession>) {
  while (setup.engine.speaking !== null) {
    setup.engine.complete();
    await settle();
  }
}

describe('the sentence chain', () => {
  it('reads every sentence once, across chapters, then ends', async () => {
    const setup = setupSession();
    await setup.start();
    await readAll(setup);
    expect(setup.engine.spoken).toEqual(
      CHAPTERS.flatMap((pages, c) => pages.map((_, i) => s(c, i))),
    );
    expect(setup.status()).toBe('ended');
    expect(setup.last()).toMatchObject({
      chapter: 2,
      sentence: 1,
      page: 5,
      finished: true,
      urgency: 'now',
    });
  });

  it('skips chapters without sentences', async () => {
    const chapters = [[], [1, 1], [], [2]];
    const setup = setupSession({ ...chapters });
    await setup.start(makeBook(chapters));
    await readAll(setup);
    expect(setup.engine.spoken).toEqual([s(1, 0), s(1, 1), s(3, 0)]);
  });

  it('passes the book language, its voice and the settings', async () => {
    const setup = setupSession();
    setup.settings.rate = 1.5;
    await setup.start();
    expect(setup.engine.last?.options).toMatchObject({
      voiceId: RO_ID,
      language: 'ro-RO',
      rate: 1.5,
      pitch: 1,
    });
  });

  it('ignores a done that comes late or twice', async () => {
    const setup = setupSession();
    await setup.start();
    setup.engine.complete();
    setup.engine.lateDone(0);
    setup.engine.lateDone(0);
    expect(setup.where()).toBe('0.1');
    expect(setup.engine.spoken).toHaveLength(2);
  });

  it('reads the next chapter ahead at 80% and keeps three in memory', async () => {
    const chapters = [[1, 1, 1, 1, 1], [2], [3], [4]];
    const setup = setupSession({ ...chapters });
    await setup.start(makeBook(chapters));
    const read = () => setup.readChapter.mock.calls.map(call => call[1]);
    for (const expected of [[0], [0], [0], [0, 1]]) {
      expect(read()).toEqual(expected);
      setup.engine.complete();
      await settle();
    }
  });

  it('starts no JS timer', async () => {
    jest.useFakeTimers();
    const setup = setupSession();
    await setup.start();
    setup.session.setSleep(15);
    setup.engine.complete();
    setup.session.pause();
    expect(jest.getTimerCount()).toBe(0);
    jest.useRealTimers();
  });
});

describe('opening', () => {
  it('goes back where asked, or as close as the text allows', async () => {
    const setup = setupSession();
    await setup.start(makeBook(), [1, 99]);
    expect(setup.where()).toBe('1.1');
    expect(setup.engine.speaking).toBe(s(1, 1));
  });

  it('paused: loads, says and stores nothing', async () => {
    const { session, engine, reports, status } = setupSession();
    session.open(makeBook(), { at: null, play: false });
    expect(status()).toBe('loading');
    await settle();
    expect(status()).toBe('paused');
    expect(session.snapshot()).toMatchObject({ page: 1, loaded: true });
    expect(engine.spoken).toEqual([]);
    expect(reports).toEqual([]);
    session.play();
    await settle();
    expect(engine.speaking).toBe(s(0, 0));
  });

  it('another book while playing: stores the first, then reads the second', async () => {
    const setup = setupSession();
    await setup.start();
    setup.engine.complete();
    const other = makeBook(CHAPTERS, {
      id: '1c7a3e5f-8b2d-4c6e-9a1f-3b4c5d6e7f80' as never,
    });
    setup.session.open(other, { at: null, play: true });
    expect(setup.last()).toMatchObject({ chapter: 0, sentence: 1 });
    expect(setup.engine.speaking).toBeNull();
    await settle();
    expect(setup.session.snapshot().bookId).toBe(other.id);
    expect(setup.engine.speaking).toBe(s(0, 0));
  });

  it('close and discard go back to idle; only close stores', async () => {
    const setup = setupSession();
    await setup.start();
    setup.session.discard(makeBook().id);
    expect(setup.status()).toBe('idle');
    const stored = setup.reports.length;
    await setup.start();
    setup.session.close();
    setup.session.close();
    expect(setup.reports.length).toBe(stored + 2);
    expect(setup.engine.speaking).toBeNull();
    setup.engine.lateDone(0);
    expect(setup.status()).toBe('idle');
  });

  it('a book without text is an error', async () => {
    const setup = setupSession({});
    await setup.start(makeBook([[], []]));
    expect(setup.session.snapshot()).toMatchObject({
      status: 'error',
      error: 'text',
    });
  });
});

describe('pause', () => {
  it('keeps the sentence and starts it again', async () => {
    const setup = setupSession();
    await setup.start();
    setup.engine.complete();
    setup.session.pause();
    expect(setup.status()).toBe('paused');
    expect(setup.engine.speaking).toBeNull();
    expect(setup.last()).toMatchObject({ sentence: 1, urgency: 'now' });
    setup.session.play();
    await settle();
    expect(setup.engine.speaking).toBe(s(0, 1));
  });

  it.each([
    [5 * 60_000, '0.1'],
    [5 * 60_000 + 1, '0.0'],
  ])('after %d ms it resumes at %s', async (ms, expected) => {
    const setup = setupSession();
    await setup.start(makeBook(), [0, 1]);
    setup.session.pause();
    setup.tick(ms);
    setup.session.play();
    await settle();
    expect(setup.where()).toBe(expected);
  });

  it('a long one at the start of a chapter resumes in the previous chapter', async () => {
    const setup = setupSession();
    await setup.start(makeBook(), [1, 0]);
    setup.session.pause();
    setup.tick(10 * 60_000);
    setup.session.play();
    await settle();
    expect(setup.where()).toBe('0.2');
  });

  it('while loading, the book stays paused once loaded', async () => {
    const { session, engine, status } = setupSession();
    session.open(makeBook(), { at: null, play: true });
    session.pause();
    await settle();
    expect(status()).toBe('paused');
    expect(engine.spoken).toEqual([]);
  });

  it('before the voice is picked, nothing is said', async () => {
    const setup = setupSession();
    await setup.start();
    setup.session.pause();
    const spoken = setup.engine.spoken.length;
    setup.session.play();
    setup.session.pause();
    await settle();
    expect(setup.engine.spoken).toHaveLength(spoken);
  });
});

describe('settings', () => {
  it('a rate change starts the current sentence again, at once', async () => {
    const setup = setupSession();
    await setup.start();
    setup.settings.rate = 2;
    setup.session.settingsChanged();
    expect(setup.engine.spoken).toEqual([s(0, 0), s(0, 0)]);
    expect(setup.engine.last?.options.rate).toBe(2);
    setup.engine.lateDone(0);
    expect(setup.where()).toBe('0.0');
    setup.engine.complete();
    expect(setup.where()).toBe('0.1');
  });

  it('says nothing while paused', async () => {
    const setup = setupSession();
    await setup.start();
    setup.session.pause();
    setup.session.settingsChanged();
    await settle();
    expect(setup.engine.spoken).toHaveLength(1);
  });

  it('a voice change picks again', async () => {
    const setup = setupSession();
    const other = { id: 'ro-2', name: '', language: 'ro-RO', quality: 1 };
    setup.engine.voices.push(other);
    await setup.start();
    setup.settings.voiceId = 'ro-2';
    setup.session.settingsChanged();
    await settle();
    expect(setup.engine.last?.options.voiceId).toBe('ro-2');
  });
});

describe('sleep', () => {
  it('after the minutes, the sentence ends and the next one waits', async () => {
    const setup = setupSession();
    await setup.start();
    setup.session.setSleep(15);
    setup.tick(15 * 60_000 - 1);
    setup.engine.complete();
    expect(setup.status()).toBe('playing');
    setup.tick(1);
    expect(setup.engine.speaking).toBe(s(0, 1));
    setup.engine.complete();
    expect(setup.status()).toBe('paused');
    expect(setup.where()).toBe('0.2');
    expect(setup.session.snapshot().sleep.type).toBe('off');
    expect(setup.last()).toMatchObject({ sentence: 2, urgency: 'now' });
  });

  it('at the end of the chapter, stops before the next one', async () => {
    const setup = setupSession();
    await setup.start(makeBook(), [0, 1]);
    setup.session.setSleep('chapter');
    setup.engine.complete();
    expect(setup.status()).toBe('playing');
    setup.engine.complete();
    await settle();
    expect(setup.status()).toBe('paused');
    expect(setup.where()).toBe('1.0');
    expect(setup.engine.spoken).toHaveLength(2);
  });

  it('at the end of the last chapter, the book is over', async () => {
    const setup = setupSession();
    await setup.start(makeBook(), [2, 1]);
    setup.session.setSleep('chapter');
    setup.engine.complete();
    expect(setup.status()).toBe('ended');
    expect(setup.last()?.finished).toBe(true);
  });

  it('can be turned off', async () => {
    const setup = setupSession();
    await setup.start();
    setup.session.setSleep(15);
    setup.session.setSleep('off');
    setup.tick(60 * 60_000);
    setup.engine.complete();
    expect(setup.status()).toBe('playing');
  });
});

describe('progress', () => {
  it('each sentence soon, each new chapter now', async () => {
    const setup = setupSession();
    await setup.start(makeBook(), [0, 1]);
    setup.engine.complete();
    setup.engine.complete();
    await settle();
    expect(
      setup.reports.map(r => [r.chapter, r.sentence, r.page, r.urgency]),
    ).toEqual([
      [0, 1, 1, 'now'],
      [0, 2, 2, 'soon'],
      [1, 0, 3, 'now'],
    ]);
  });

  it('flush stores only what plays', async () => {
    const setup = setupSession();
    setup.session.flush();
    await setup.start();
    const before = setup.reports.length;
    setup.session.flush();
    expect(setup.last()?.urgency).toBe('now');
    expect(setup.reports.length).toBe(before + 1);
  });
});

describe('remaining time', () => {
  it('follows the measured speed and the rate', async () => {
    const setup = setupSession();
    expect(setup.session.remainingSeconds()).toBeNull();
    await setup.start();
    const length = s(0, 0).length;
    // 10 characters (the sentence's length) per second at 1×
    setup.engine.start();
    setup.tick(1000);
    setup.engine.last?.options.onDone();
    const before = setup.session.remainingSeconds() ?? 0;
    expect(before).toBeCloseTo(6);
    expect(length).toBeGreaterThan(0);
    setup.settings.rate = 2;
    expect(setup.session.remainingSeconds()).toBeCloseTo(before / 2);
  });
});
