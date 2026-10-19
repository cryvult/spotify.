import { createContext, useContext, useSyncExternalStore } from 'react';
import type { AudioEngine, PlaybackProgress } from '../services/audioEngine';
import type { Track } from '../types/music';
import type { PlaybackContext, PlayerState, QueueEntry } from '../types/player';

export interface QueueItem {
  entry: QueueEntry;
  track: Track;
}

/** Stan odtwarzacza wraz z wyliczonymi wartościami pomocniczymi. */
export interface PlayerStateValue {
  state: PlayerState;
  currentEntry: QueueEntry | null;
  currentTrack: Track | null;
  upcoming: QueueItem[];
  /** Muzyka gra albo za chwilę zacznie (trwa wczytywanie). */
  isPlaying: boolean;
  /** Trwa wczytywanie lub buforowanie. */
  isBuffering: boolean;
  hasNext: boolean;
}

export interface PlayOptions {
  startIndex?: number;
  context?: PlaybackContext | null;
  /** Wymusza tryb losowy (np. przycisk „Odtwarzaj losowo”). */
  shuffle?: boolean;
}

/** Akcje odtwarzacza. Obiekt jest stały, więc komponenty używające tylko akcji nie renderują się ponownie. */
export interface PlayerControls {
  playTracks: (tracks: Track[], options?: PlayOptions) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  seekBy: (deltaSeconds: number) => void;
  jumpTo: (uid: string) => void;
  addToQueue: (tracks: Track[]) => void;
  playNext: (tracks: Track[]) => void;
  removeFromQueue: (uid: string) => void;
  clearUpcoming: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setVolume: (volume: number) => void;
  changeVolumeBy: (delta: number) => void;
  toggleMute: () => void;
  retry: () => void;
  /** Zatrzymuje muzykę i czyści całą kolejkę (np. po usunięciu danych). */
  stopAndClear: () => void;
  /** Na iOS strona nie może zmieniać głośności (tylko przyciski telefonu). */
  canControlVolume: boolean;
}

export const PlayerStateContext = createContext<PlayerStateValue | null>(null);
export const PlayerControlsContext = createContext<PlayerControls | null>(null);
export const PlayerEngineContext = createContext<AudioEngine | null>(null);

export function usePlayerState(): PlayerStateValue {
  const value = useContext(PlayerStateContext);
  if (!value) throw new Error('usePlayerState musi być użyte wewnątrz <PlayerProvider>.');
  return value;
}

export function usePlayerControls(): PlayerControls {
  const value = useContext(PlayerControlsContext);
  if (!value) throw new Error('usePlayerControls musi być użyte wewnątrz <PlayerProvider>.');
  return value;
}

const NO_PROGRESS: PlaybackProgress = { currentTime: 0, duration: 0, buffered: 0 };
const noopSubscribe = () => () => {};

/**
 * Postęp odtwarzania (czas, długość, bufor). Osobny hook, aby co sekundę renderował się
 * tylko pasek postępu, a nie cała aplikacja.
 */
export function usePlaybackProgress(): PlaybackProgress {
  const engine = useContext(PlayerEngineContext);
  return useSyncExternalStore(
    engine?.subscribeProgress ?? noopSubscribe,
    engine?.getProgress ?? (() => NO_PROGRESS),
    () => NO_PROGRESS,
  );
}

/** Czy aktualnie odtwarzana lista pochodzi z danego źródła (np. tego albumu)? */
export function isPlayingFrom(state: PlayerState, type: PlaybackContext['type'], id: string | null): boolean {
  return state.context?.type === type && state.context.id === id && state.currentIndex >= 0;
}
