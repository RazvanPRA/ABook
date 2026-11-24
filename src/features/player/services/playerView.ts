import type { SessionSnapshot } from './session';

/** What the player's tab shows (the states table of the M5 plan). */
export type PlayerView =
  | 'empty'
  | 'loading'
  | 'text'
  | 'waiting'
  | 'ended'
  | 'incomplete'
  | 'speech'
  | 'voice'
  | 'missingText';

export function playerView(
  { status, waiting, incomplete, loaded, error }: SessionSnapshot,
  opening: boolean,
): PlayerView {
  if (opening) {
    return 'loading';
  }
  switch (status) {
    case 'idle':
      return 'empty';
    case 'ended':
      return incomplete ? 'incomplete' : 'ended';
    case 'error':
      return error === 'text' || error === null ? 'missingText' : error;
    default:
      if (waiting) {
        return 'waiting';
      }
      return loaded ? 'text' : 'loading';
  }
}
