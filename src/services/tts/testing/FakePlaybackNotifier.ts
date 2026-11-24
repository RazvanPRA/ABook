import type {
  PlaybackCommand,
  PlaybackInfo,
  PlaybackNotifier,
} from '../playbackNotifier';

/** A `PlaybackNotifier` for tests: what is shown now, and `send` to press its buttons. */
export class FakePlaybackNotifier implements PlaybackNotifier {
  shown: PlaybackInfo | null = null;
  private listeners: ((command: PlaybackCommand) => void)[] = [];

  show(info: PlaybackInfo): void {
    this.shown = info;
  }

  hide(): void {
    this.shown = null;
  }

  onCommand(listener: (command: PlaybackCommand) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(known => known !== listener);
    };
  }

  send(command: PlaybackCommand): void {
    this.listeners.forEach(listener => listener(command));
  }
}
