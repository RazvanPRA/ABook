import { EN_VOICE, RO_VOICE } from '@/services/tts/testing';
import { position, sentenceText as s } from '../../../__fixtures__/chapters';
import {
  CHAPTERS,
  makeBook,
  settle,
  setupSession,
} from '../../../__fixtures__/sessionSetup';

describe('speech errors', () => {
  it('tries the sentence once more, then goes on', async () => {
    const setup = setupSession();
    await setup.start();
    setup.engine.fail();
    expect(setup.engine.spoken).toEqual([s(0, 0), s(0, 0)]);
    setup.engine.complete();
    expect(setup.where()).toBe('0.1');
  });

  it('fails the second time, and play tries again', async () => {
    const setup = setupSession();
    await setup.start();
    setup.engine.fail();
    setup.engine.fail('engine');
    expect(setup.session.snapshot()).toMatchObject({
      status: 'error',
      error: 'speech',
    });
    setup.session.play();
    await settle();
    expect(setup.status()).toBe('playing');
    expect(setup.session.snapshot().error).toBeNull();
    expect(setup.engine.speaking).toBe(s(0, 0));
  });

  it('each sentence has its own second try', async () => {
    const setup = setupSession();
    await setup.start();
    for (let i = 0; i < 2; i += 1) {
      setup.engine.fail();
      setup.engine.complete();
    }
    expect(setup.where()).toBe('0.2');
    expect(setup.status()).toBe('playing');
  });

  it('a language the engine refuses is a voice error', async () => {
    const setup = setupSession();
    await setup.start();
    setup.engine.fail('language');
    setup.engine.fail('language');
    expect(setup.session.snapshot().error).toBe('voice');
  });

  it('moving away from an error waits for play', async () => {
    const setup = setupSession();
    await setup.start();
    setup.engine.fail();
    setup.engine.fail();
    setup.session.seekSentence(1);
    expect(setup.status()).toBe('paused');
    expect(setup.session.snapshot().error).toBeNull();
  });
});

describe('voices', () => {
  it('replaces a saved voice that is gone, and says so once', async () => {
    const setup = setupSession();
    setup.settings.voiceId = 'gone';
    await setup.start();
    expect(setup.engine.last?.options.voiceId).toBe(RO_VOICE.id);
    expect(setup.session.snapshot().voiceReplaced).toBe(true);
    setup.session.acknowledgeVoice();
    setup.engine.complete();
    expect(setup.session.snapshot().voiceReplaced).toBe(false);
  });

  it('a saved voice of another language is not missing', async () => {
    const setup = setupSession();
    setup.settings.voiceId = EN_VOICE.id;
    await setup.start();
    expect(setup.engine.last?.options.voiceId).toBe(RO_VOICE.id);
    expect(setup.session.snapshot().voiceReplaced).toBe(false);
  });

  it('without a voice of the language nothing is said, until one is installed', async () => {
    const setup = setupSession();
    setup.engine.voices = [EN_VOICE];
    await setup.start();
    expect(setup.session.snapshot()).toMatchObject({
      status: 'error',
      error: 'voice',
      voiceReplaced: false,
    });
    expect(setup.engine.spoken).toEqual([]);
    setup.engine.voices = [EN_VOICE, RO_VOICE];
    setup.session.play();
    await settle();
    expect(setup.engine.speaking).toBe(s(0, 0));
  });

  it('without an engine it is a speech error', async () => {
    const setup = setupSession();
    setup.engine.available = false;
    await setup.start();
    expect(setup.session.snapshot().error).toBe('speech');
  });
});

describe('a chapter that can not be read', () => {
  it.each([
    ['missing', async () => null],
    ['failing', () => Promise.reject(new Error('disk'))],
    ['empty', async () => ({ sentences: [], sentencePages: [] })],
  ])('%s: an error, tried again by play', async (_name, answer) => {
    const setup = setupSession();
    await setup.start(makeBook(), [0, 2]);
    setup.readChapter.mockReset();
    setup.readChapter.mockImplementation(answer);
    setup.session.seekTo(position(2, 0));
    await settle();
    expect(setup.session.snapshot()).toMatchObject({
      status: 'error',
      error: 'text',
      loaded: false,
    });
    expect(setup.last()).toMatchObject({ chapter: 0 });
    setup.readChapter.mockImplementation(async () => ({
      sentences: ['Gata.'],
      sentencePages: [4 as never],
    }));
    setup.session.play();
    await settle();
    expect(setup.engine.speaking).toBe('Gata.');
  });

  it('can be skipped, and the last one ends the book', async () => {
    const rest = { 0: CHAPTERS[0], 2: CHAPTERS[2] };
    const setup = setupSession(rest);
    await setup.start(makeBook(), [0, 2]);
    setup.engine.complete();
    await settle();
    expect(setup.session.snapshot().error).toBe('text');
    setup.session.skipChapter();
    await settle();
    expect(setup.engine.speaking).toBe(s(2, 0));
    setup.session.skipChapter();
    expect(setup.status()).toBe('ended');
  });
});

describe('a book still importing', () => {
  const part = (count: number, completeness: 'importing' | 'incomplete') =>
    makeBook(CHAPTERS.slice(0, count), { completeness });

  it('waits for the next chapter and goes on by itself', async () => {
    const setup = setupSession();
    await setup.start(part(1, 'importing'), [0, 2]);
    setup.engine.complete();
    expect(setup.session.snapshot()).toMatchObject({
      status: 'loading',
      waiting: true,
    });
    expect(setup.last()).toMatchObject({ sentence: 2, finished: false });
    setup.session.updateBook(part(1, 'importing'));
    expect(setup.session.snapshot().waiting).toBe(true);
    setup.session.updateBook(part(2, 'importing'));
    await settle();
    expect(setup.engine.speaking).toBe(s(1, 0));
  });

  it('waits before the first chapter too', async () => {
    const setup = setupSession();
    await setup.start(part(0, 'importing'));
    expect(setup.session.snapshot().waiting).toBe(true);
    setup.session.updateBook(part(1, 'importing'));
    await settle();
    expect(setup.engine.speaking).toBe(s(0, 0));
  });

  it('paused while waiting, it stays paused', async () => {
    const setup = setupSession();
    await setup.start(part(1, 'importing'), [0, 2]);
    setup.engine.complete();
    setup.session.pause();
    setup.session.updateBook(part(2, 'importing'));
    await settle();
    expect(setup.status()).toBe('paused');
    expect(setup.engine.spoken).toHaveLength(1);
  });

  it('a stopped import ends it unfinished; its next chapter only shows', async () => {
    const setup = setupSession();
    await setup.start(part(1, 'importing'), [0, 2]);
    setup.engine.complete();
    setup.session.updateBook(part(1, 'incomplete'));
    expect(setup.session.snapshot()).toMatchObject({
      status: 'ended',
      incomplete: true,
      waiting: false,
    });
    expect(setup.last()?.finished).toBe(false);
    setup.session.updateBook(part(2, 'importing'));
    await settle();
    expect(setup.status()).toBe('paused');
    expect(setup.where()).toBe('1.0');
  });

  it('an import that ends with nothing more finishes the book', async () => {
    const setup = setupSession();
    await setup.start(part(1, 'importing'), [0, 2]);
    setup.engine.complete();
    setup.session.updateBook(makeBook(CHAPTERS.slice(0, 1)));
    expect(setup.session.snapshot()).toMatchObject({
      status: 'ended',
      incomplete: false,
    });
    expect(setup.last()?.finished).toBe(true);
  });

  it('a new chapter while playing is only noted', async () => {
    const setup = setupSession();
    await setup.start(part(1, 'importing'));
    setup.session.updateBook(part(2, 'importing'));
    expect(setup.engine.spoken).toHaveLength(1);
  });
});

it('an ended book starts over on play', async () => {
  const setup = setupSession();
  await setup.start(makeBook(), [2, 1]);
  setup.engine.complete();
  setup.session.play();
  await settle();
  expect(setup.engine.speaking).toBe(s(0, 0));
  expect(setup.last()).toMatchObject({ chapter: 0, finished: false });
});
