// Typy stanu odtwarzacza i kolejki.

export type RepeatMode = 'off' | 'all' | 'one';

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

/**
 * Pozycja w kolejce. `uid` odróżnia dwa wystąpienia tego samego utworu.
 * `origin: 'user'` oznacza utwór dodany ręcznie przyciskiem „Dodaj do kolejki”.
 */
export interface QueueEntry {
  uid: string;
  trackId: string;
  origin: 'context' | 'user';
}

export type PlaybackContextType =
  | 'album'
  | 'artist'
  | 'playlist'
  | 'liked'
  | 'recent'
  | 'genre'
  | 'search'
  | 'discover'
  | 'autoplay'
  | 'queue';

/** Skąd pochodzi aktualnie odtwarzana lista (np. „Album: Szkło i mgła”). */
export interface PlaybackContext {
  type: PlaybackContextType;
  id: string | null;
  title: string;
  /** Ścieżka w aplikacji, pod którą można wrócić do źródła. */
  path: string | null;
}

export interface PlayerState {
  queue: QueueEntry[];
  /** Kolejność sprzed włączenia trybu losowego (null, gdy tryb jest wyłączony). */
  originalQueue: QueueEntry[] | null;
  currentIndex: number;
  context: PlaybackContext | null;
  status: PlaybackStatus;
  /** Czy użytkownik chce, aby muzyka grała (nawet jeśli plik jeszcze się wczytuje). */
  wantsToPlay: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  muted: boolean;
  error: string | null;
  autoplayBlocked: boolean;
  /** Zwiększany, gdy ten sam utwór trzeba wczytać ponownie (np. po błędzie). */
  loadToken: number;
  /** Pozycja (s), od której wznowić utwór przywrócony po odświeżeniu strony. */
  resumeAt: number;
}
