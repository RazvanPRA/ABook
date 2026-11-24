import type { Spec, UtteranceEvent } from '../../../../specs/NativeAbookTts';
import { createNativeTtsEngine } from '../createNativeTtsEngine';
import { TtsError } from '../types';

function setup() {
  let emit: (event: UtteranceEvent) => void = () => {};
  const native = {
    getVoices: jest.fn<ReturnType<Spec['getVoices']>, []>(async () => []),
    speak: jest.fn<void, Parameters<Spec['speak']>>(),
    stop: jest.fn(async () => {}),
    isSpeaking: jest.fn(async () => true),
    openSettings: jest.fn(async () => {}),
    onUtterance: ((handler: (event: UtteranceEvent) => void) => {
      emit = handler;
      return { remove: () => {} };
    }) as Spec['onUtterance'],
  };
  const engine = createNativeTtsEngine(native);
  const speak = (text: string) => {
    const calls = { onStart: jest.fn(), onDone: jest.fn(), onError: jest.fn() };
    engine.speak(text, {
      voiceId: null,
      language: 'ro-RO',
      rate: 1.25,
      pitch: 1,
      ...calls,
    });
    const id = native.speak.mock.lastCall?.[0].id ?? '';
    return { ...calls, id };
  };
  return {
    native,
    engine,
    speak,
    emit: (id: string, type: string, code = '') => emit({ id, type, code }),
  };
}

describe('speaking', () => {
  it('passes the request with an id of its own', () => {
    const { native, speak } = setup();
    const first = speak('Unu.');
    const second = speak('Doi.');
    expect(native.speak.mock.calls[0]?.[0]).toEqual({
      id: first.id,
      text: 'Unu.',
      voiceId: null,
      language: 'ro-RO',
      rate: 1.25,
      pitch: 1,
    });
    expect(second.id).not.toBe(first.id);
  });

  it('routes start and done to the current utterance', () => {
    const { speak, emit } = setup();
    const calls = speak('Unu.');
    emit(calls.id, 'start');
    expect(calls.onStart).toHaveBeenCalledTimes(1);
    expect(calls.onDone).not.toHaveBeenCalled();
    emit(calls.id, 'done');
    expect(calls.onDone).toHaveBeenCalledTimes(1);
  });

  it('drops the late events of a replaced utterance', () => {
    const { speak, emit } = setup();
    const first = speak('Unu.');
    const second = speak('Doi.');
    emit(first.id, 'done');
    emit(first.id, 'error', 'synthesis');
    expect(first.onDone).not.toHaveBeenCalled();
    expect(first.onError).not.toHaveBeenCalled();
    emit(second.id, 'done');
    expect(second.onDone).toHaveBeenCalledTimes(1);
  });

  it('drops the events that come after stop, and a second done', async () => {
    const { engine, native, speak, emit } = setup();
    const first = speak('Unu.');
    await engine.stop();
    emit(first.id, 'done');
    expect(native.stop).toHaveBeenCalledTimes(1);
    expect(first.onDone).not.toHaveBeenCalled();
    const second = speak('Doi.');
    emit(second.id, 'done');
    emit(second.id, 'done');
    expect(second.onDone).toHaveBeenCalledTimes(1);
  });

  it('lets onDone speak the next one', () => {
    const { speak, emit } = setup();
    const first = speak('Unu.');
    let next: ReturnType<typeof speak> | undefined;
    first.onDone.mockImplementation(() => {
      next = speak('Doi.');
    });
    emit(first.id, 'done');
    emit(next?.id ?? '', 'done');
    expect(next?.onDone).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['engine', 'engine'],
    ['language', 'language'],
    ['synthesis', 'synthesis'],
    ['something-new', 'synthesis'],
  ])('maps the native error %s to %s', (native, code) => {
    const { speak, emit } = setup();
    const calls = speak('Unu.');
    emit(calls.id, 'error', native);
    expect(calls.onError).toHaveBeenCalledWith(
      expect.objectContaining({ code }),
    );
  });
});

describe('voices', () => {
  const voice = (id: string, extra = {}) => ({
    id,
    name: id,
    language: 'ro-RO',
    quality: 300,
    network: false,
    installed: true,
    ...extra,
  });

  it('keeps the installed offline ones, best first', async () => {
    const { engine, native } = setup();
    native.getVoices.mockResolvedValue([
      voice('b'),
      voice('a'),
      voice('best', { quality: 500 }),
      voice('net', { network: true }),
      voice('absent', { installed: false }),
    ]);
    const ids = (await engine.listVoices()).map(({ id }) => id);
    expect(ids).toEqual(['best', 'a', 'b']);
  });

  it('rejects with an engine error when there is none', async () => {
    const { engine, native } = setup();
    native.getVoices.mockRejectedValue(new Error('No speech engine'));
    await expect(engine.listVoices()).rejects.toEqual(new TtsError('engine'));
  });
});

it('passes isSpeaking and openSettings through', async () => {
  const { engine, native } = setup();
  expect(await engine.isSpeaking()).toBe(true);
  await engine.openSettings();
  expect(native.openSettings).toHaveBeenCalledTimes(1);
});
