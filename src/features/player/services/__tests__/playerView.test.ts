import { playerView } from '../playerView';
import { IDLE, type SessionSnapshot } from '../session';

it.each<[Partial<SessionSnapshot>, boolean, string]>([
  [{}, false, 'empty'],
  [{}, true, 'loading'],
  [{ status: 'loading' }, false, 'loading'],
  [{ status: 'loading', loaded: true }, false, 'text'],
  [{ status: 'loading', waiting: true, loaded: true }, false, 'waiting'],
  [{ status: 'playing', loaded: true }, false, 'text'],
  [{ status: 'paused', loaded: true }, false, 'text'],
  [{ status: 'paused', loaded: false }, false, 'loading'],
  [{ status: 'ended' }, false, 'ended'],
  [{ status: 'ended', incomplete: true }, false, 'incomplete'],
  [{ status: 'error', error: 'speech' }, false, 'speech'],
  [{ status: 'error', error: 'voice' }, false, 'voice'],
  [{ status: 'error', error: 'text' }, false, 'missingText'],
])('%j, opening %s: %s', (session, opening, view) => {
  expect(playerView({ ...IDLE, ...session }, opening)).toBe(view);
});
