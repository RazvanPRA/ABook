import { FakeTtsEngine } from '../FakeTtsEngine';

const options = () => ({
  voiceId: null,
  language: 'ro-RO',
  rate: 1,
  pitch: 1,
  onStart: jest.fn(),
  onDone: jest.fn(),
  onError: jest.fn(),
});

it('completes and fails on demand, one utterance at a time', async () => {
  const engine = new FakeTtsEngine();
  const first = options();
  const second = options();
  engine.speak('Unu.', first);
  engine.speak('Doi.', second);
  expect(engine.spoken).toEqual(['Unu.', 'Doi.']);
  engine.complete();
  expect(first.onDone).not.toHaveBeenCalled();
  expect(second.onDone).toHaveBeenCalledTimes(1);
  expect(await engine.isSpeaking()).toBe(false);
  engine.speak('Trei.', first);
  engine.fail('engine');
  expect(first.onError).toHaveBeenCalledWith(
    expect.objectContaining({ code: 'engine' }),
  );
});

it('stays silent after stop, and can be unavailable', async () => {
  const engine = new FakeTtsEngine();
  const calls = options();
  engine.speak('Unu.', calls);
  await engine.stop();
  engine.complete();
  expect(calls.onDone).not.toHaveBeenCalled();
  engine.available = false;
  await expect(engine.listVoices()).rejects.toMatchObject({ code: 'engine' });
});
