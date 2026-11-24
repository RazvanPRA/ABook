import { useDispatch } from 'react-redux';
import type { PlayerDispatch } from '../model/dependencies';

/** Dispatch that accepts the player's thunks (the app store's dispatch satisfies it). */
export const usePlayerDispatch = () => useDispatch<PlayerDispatch>();
