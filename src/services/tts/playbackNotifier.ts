/** `stop`: the app was swiped away. */
export const PLAYBACK_COMMANDS = ['play', 'pause', 'stop'] as const;
export type PlaybackCommand = (typeof PLAYBACK_COMMANDS)[number];

/** What the system shows while a book is played; texts already translated. */
export interface PlaybackInfo {
  readonly title: string;
  readonly text: string;
  readonly playing: boolean;
  /** Of the button: pause while playing, play otherwise. */
  readonly actionLabel: string;
  /** Name of the notifications' group in the system settings. */
  readonly channelName: string;
}

/** Keeps playback going in the background, with its controls in the notifications. */
export interface PlaybackNotifier {
  /** Starts it, from the foreground only, or changes what it shows. */
  show(info: PlaybackInfo): void;
  hide(): void;
  /** Returns the unsubscribe. */
  onCommand(listener: (command: PlaybackCommand) => void): () => void;
}
