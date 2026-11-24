import type {
  PlaybackCommandEvent,
  Spec,
} from '../../../../specs/NativeAbookTts';
import { createNativePlaybackNotifier } from '../createNativePlaybackNotifier';
import { FakePlaybackNotifier } from '../testing';

const INFO = {
  title: 'Ion',
  text: 'Capitolul 1',
  playing: true,
  actionLabel: 'Pauză',
  channelName: 'Redare',
};

function setup(ask = jest.fn(async () => {})) {
  let emit: (event: PlaybackCommandEvent) => void = () => {};
  const remove = jest.fn();
  const native = {
    showPlayback: jest.fn(),
    hidePlayback: jest.fn(),
    onPlaybackCommand: ((handler: typeof emit) => {
      emit = handler;
      return { remove };
    }) as unknown as Spec['onPlaybackCommand'],
  };
  return {
    native,
    ask,
    remove,
    notifier: createNativePlaybackNotifier(native, ask),
    emit: (type: string) => emit({ type }),
  };
}

it('asks for the notifications once, and shows again after the answer', async () => {
  const { notifier, native, ask } = setup();
  notifier.show(INFO);
  expect(native.showPlayback).toHaveBeenCalledWith(INFO);
  await Promise.resolve();
  expect(native.showPlayback).toHaveBeenCalledTimes(2);
  notifier.show({ ...INFO, playing: false });
  expect(ask).toHaveBeenCalledTimes(1);
  expect(native.showPlayback).toHaveBeenCalledTimes(3);
});

it('works without the permission', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const { notifier, native } = setup(
    jest.fn(() => Promise.reject(new Error('no activity'))),
  );
  notifier.show(INFO);
  await Promise.resolve();
  await Promise.resolve();
  expect(native.showPlayback).toHaveBeenCalledWith(INFO);
  warn.mockRestore();
});

it('passes the known commands on until unsubscribed', () => {
  const { notifier, emit, remove } = setup();
  const listener = jest.fn();
  const off = notifier.onCommand(listener);
  ['play', 'pause', 'stop', 'interruption', 'other'].forEach(emit);
  expect(listener.mock.calls).toEqual([['play'], ['pause'], ['stop']]);
  off();
  expect(remove).toHaveBeenCalledTimes(1);
});

it('the fake remembers what is shown and sends commands', () => {
  const fake = new FakePlaybackNotifier();
  const listener = jest.fn();
  const off = fake.onCommand(listener);
  fake.show(INFO);
  expect(fake.shown).toEqual(INFO);
  fake.send('pause');
  off();
  fake.send('play');
  fake.hide();
  expect(fake.shown).toBeNull();
  expect(listener.mock.calls).toEqual([['pause']]);
});
