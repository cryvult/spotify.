// Logika kolejki i trybów odtwarzania jako czysta funkcja (reducer).
// Nie dotyka dźwięku ani przeglądarki, dzięki czemu łatwo ją przetestować.
// Odtwarzaniem steruje PlayerProvider, który obserwuje ten stan.

import type { PlaybackContext, PlayerState, QueueEntry, RepeatMode } from '../../types/player';
import { createSeededRandom, shuffleArray } from '../../utils/shuffleArray';

export type PlayerAction =
  | {
      type: 'playList';
      entries: QueueEntry[];
      startIndex: number;
      context: PlaybackContext | null;
      /** true lub false wymusza tryb losowy; undefined zostawia bieżące ustawienie. */
      shuffle?: boolean;
      seed: number;
    }
  | { type: 'togglePlay' }
  | { type: 'setWantsToPlay'; value: boolean }
  | { type: 'next'; auto: boolean }
  | { type: 'previous' }
  | { type: 'restartCurrent' }
  | { type: 'jumpTo'; uid: string }
  | { type: 'enqueue'; entries: QueueEntry[]; position: 'next' | 'last' }
  | { type: 'appendAutoplay'; entries: QueueEntry[]; context: PlaybackContext }
  | { type: 'remove'; uid: string }
  | { type: 'clearUpcoming' }
  | { type: 'toggleShuffle'; seed: number }
  | { type: 'cycleRepeat' }
  | { type: 'setVolume'; volume: number }
  | { type: 'toggleMute' }
  | { type: 'retry' }
  | { type: 'engineLoading' }
  | { type: 'engineReady' }
  | { type: 'enginePlaying' }
  | { type: 'enginePaused' }
  | { type: 'engineError'; message: string }
  | { type: 'playBlocked' }
  | { type: 'reset' };

export const INITIAL_PLAYER_STATE: PlayerState = {
  queue: [],
  originalQueue: null,
  currentIndex: -1,
  context: null,
  status: 'idle',
  wantsToPlay: false,
  shuffle: false,
  repeat: 'off',
  volume: 0.8,
  muted: false,
  error: null,
  autoplayBlocked: false,
  loadToken: 0,
  resumeAt: 0,
};

const REPEAT_ORDER: RepeatMode[] = ['off', 'all', 'one'];

export function getCurrentEntry(state: PlayerState): QueueEntry | null {
  return state.queue[state.currentIndex] ?? null;
}

/** Utwory zaplanowane po bieżącym. */
export function getUpcoming(state: PlayerState): QueueEntry[] {
  return state.currentIndex < 0 ? state.queue : state.queue.slice(state.currentIndex + 1);
}

/** Zmiana utworu: zawsze zaczynamy od początku i czyścimy poprzedni błąd. */
function moveTo(state: PlayerState, index: number, wantsToPlay: boolean): PlayerState {
  const sameEntry = index === state.currentIndex;
  return {
    ...state,
    currentIndex: index,
    wantsToPlay,
    status: 'loading',
    error: null,
    resumeAt: 0,
    // Ten sam wpis trzeba wczytać ponownie, aby zaczął się od początku.
    loadToken: sameEntry ? state.loadToken + 1 : state.loadToken,
  };
}

/** Pozycja, za którą wstawiamy utwory „Dodaj do kolejki”: po bieżącym i po wcześniej dodanych ręcznie. */
function userQueueInsertIndex(queue: QueueEntry[], currentIndex: number): number {
  let index = currentIndex + 1;
  while (queue[index]?.origin === 'user') index++;
  return index;
}

function insertAt<T>(items: T[], index: number, inserted: T[]): T[] {
  return [...items.slice(0, index), ...inserted, ...items.slice(index)];
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'playList': {
      if (action.entries.length === 0) return state;
      const start = Math.min(Math.max(action.startIndex, 0), action.entries.length - 1);
      const startEntry = action.entries[start] as QueueEntry;
      // Utwory dodane ręcznie do kolejki zostają i zagrają zaraz po wybranym utworze.
      const pendingUser = getUpcoming(state).filter((entry) => entry.origin === 'user');
      const ordered = [
        ...action.entries.slice(0, start + 1),
        ...pendingUser,
        ...action.entries.slice(start + 1),
      ];
      const shuffle = action.shuffle ?? state.shuffle;
      if (shuffle) {
        const rest = shuffleArray(
          [...action.entries.slice(0, start), ...action.entries.slice(start + 1)],
          createSeededRandom(action.seed),
        );
        return {
          ...moveTo({ ...state, queue: [startEntry, ...pendingUser, ...rest] }, 0, true),
          originalQueue: ordered,
          shuffle: true,
          context: action.context,
          autoplayBlocked: false,
          loadToken: state.loadToken + 1,
        };
      }
      return {
        ...moveTo({ ...state, queue: ordered }, start, true),
        originalQueue: null,
        shuffle: false,
        context: action.context,
        autoplayBlocked: false,
        loadToken: state.loadToken + 1,
      };
    }

    case 'togglePlay': {
      if (state.currentIndex < 0) return state;
      if (state.status === 'error')
        return {
          ...state,
          status: 'loading',
          error: null,
          wantsToPlay: true,
          loadToken: state.loadToken + 1,
        };
      const playing = state.status === 'playing' || (state.wantsToPlay && state.status === 'loading');
      return { ...state, wantsToPlay: !playing, autoplayBlocked: false };
    }

    case 'setWantsToPlay':
      if (state.currentIndex < 0) return state;
      return { ...state, wantsToPlay: action.value, autoplayBlocked: false };

    case 'next': {
      if (state.queue.length === 0) return state;
      const isLast = state.currentIndex >= state.queue.length - 1;
      if (!isLast) return moveTo(state, state.currentIndex + 1, true);
      if (state.repeat === 'all') return moveTo(state, 0, true);
      // Koniec kolejki bez powtarzania: wracamy na początek i zatrzymujemy muzykę.
      if (action.auto) return { ...moveTo(state, state.currentIndex, false), loadToken: state.loadToken + 1 };
      return { ...moveTo(state, 0, false), loadToken: state.loadToken + 1 };
    }

    case 'previous': {
      if (state.queue.length === 0) return state;
      if (state.currentIndex > 0) return moveTo(state, state.currentIndex - 1, true);
      if (state.repeat === 'all') return moveTo(state, state.queue.length - 1, true);
      return moveTo(state, 0, true);
    }

    case 'restartCurrent':
      if (state.currentIndex < 0) return state;
      return moveTo(state, state.currentIndex, true);

    case 'jumpTo': {
      const index = state.queue.findIndex((entry) => entry.uid === action.uid);
      return index === -1 ? state : moveTo(state, index, true);
    }

    case 'enqueue': {
      if (action.entries.length === 0) return state;
      if (state.currentIndex < 0) {
        // Nic nie gra: dodane utwory tworzą nową kolejkę, gotową do odtworzenia.
        return {
          ...moveTo({ ...state, queue: action.entries, originalQueue: null }, 0, false),
          status: 'paused',
          context: null,
        };
      }
      const index =
        action.position === 'next'
          ? state.currentIndex + 1
          : userQueueInsertIndex(state.queue, state.currentIndex);
      const queue = insertAt(state.queue, index, action.entries);
      let originalQueue = state.originalQueue;
      if (originalQueue) {
        const current = getCurrentEntry(state);
        const anchor = originalQueue.findIndex((entry) => entry.uid === current?.uid);
        originalQueue = insertAt(originalQueue, anchor + 1, action.entries);
      }
      return { ...state, queue, originalQueue };
    }

    case 'appendAutoplay': {
      if (action.entries.length === 0) return state;
      const queue = [...state.queue, ...action.entries];
      const originalQueue = state.originalQueue ? [...state.originalQueue, ...action.entries] : null;
      return {
        ...moveTo({ ...state, queue, originalQueue }, state.queue.length, true),
        context: action.context,
      };
    }

    case 'remove': {
      const index = state.queue.findIndex((entry) => entry.uid === action.uid);
      if (index === -1 || index === state.currentIndex) return state;
      return {
        ...state,
        queue: state.queue.filter((entry) => entry.uid !== action.uid),
        originalQueue: state.originalQueue?.filter((entry) => entry.uid !== action.uid) ?? null,
        currentIndex: index < state.currentIndex ? state.currentIndex - 1 : state.currentIndex,
      };
    }

    case 'clearUpcoming': {
      if (state.currentIndex < 0) return state;
      const queue = state.queue.slice(0, state.currentIndex + 1);
      const kept = new Set(queue.map((entry) => entry.uid));
      return {
        ...state,
        queue,
        originalQueue: state.originalQueue?.filter((entry) => kept.has(entry.uid)) ?? null,
      };
    }

    case 'toggleShuffle': {
      if (state.shuffle) {
        // Wyłączenie: przywracamy pierwotną kolejność i odnajdujemy w niej bieżący utwór.
        const current = getCurrentEntry(state);
        const queue = state.originalQueue ?? state.queue;
        const currentIndex = current ? queue.findIndex((entry) => entry.uid === current.uid) : -1;
        return {
          ...state,
          shuffle: false,
          originalQueue: null,
          queue,
          currentIndex: currentIndex === -1 ? state.currentIndex : currentIndex,
        };
      }
      const played = state.queue.slice(0, state.currentIndex + 1);
      const upcoming = shuffleArray(getUpcoming(state), createSeededRandom(action.seed));
      return { ...state, shuffle: true, originalQueue: state.queue, queue: [...played, ...upcoming] };
    }

    case 'cycleRepeat': {
      const next = REPEAT_ORDER[(REPEAT_ORDER.indexOf(state.repeat) + 1) % REPEAT_ORDER.length] as RepeatMode;
      return { ...state, repeat: next };
    }

    case 'setVolume': {
      const volume = Math.min(1, Math.max(0, action.volume));
      // Przesunięcie suwaka powyżej zera wyłącza wyciszenie, tak jak w innych odtwarzaczach.
      return { ...state, volume, muted: volume === 0 ? state.muted : false };
    }

    case 'toggleMute':
      if (state.muted || state.volume === 0)
        return { ...state, muted: false, volume: state.volume === 0 ? 0.5 : state.volume };
      return { ...state, muted: true };

    case 'retry':
      if (state.currentIndex < 0) return state;
      return { ...state, status: 'loading', error: null, wantsToPlay: true, loadToken: state.loadToken + 1 };

    case 'engineLoading':
      return state.status === 'loading' ? state : { ...state, status: 'loading' };

    case 'engineReady':
      return state.status === 'loading' && !state.wantsToPlay ? { ...state, status: 'paused' } : state;

    case 'enginePlaying':
      return { ...state, status: 'playing', wantsToPlay: true, error: null, autoplayBlocked: false };

    case 'enginePaused':
      // Po błędzie przeglądarka wysyła jeszcze „pause”: komunikat o błędzie musi zostać widoczny.
      if (state.status === 'error') return { ...state, wantsToPlay: false };
      return { ...state, status: 'paused', wantsToPlay: false };

    case 'engineError':
      return { ...state, status: 'error', wantsToPlay: false, error: action.message };

    case 'playBlocked':
      return { ...state, status: 'paused', wantsToPlay: false, autoplayBlocked: true };

    case 'reset':
      return { ...INITIAL_PLAYER_STATE, volume: state.volume, muted: state.muted };

    default:
      return state;
  }
}
