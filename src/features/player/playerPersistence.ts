// Zapisywanie i przywracanie stanu odtwarzacza (kolejka, pozycja, głośność, tryby).

import type { PlaybackContext, PlayerState, QueueEntry, RepeatMode } from '../../types/player';
import { clampNumber, isBoolean, isRecord, isString, oneOf } from '../../utils/validation';
import { INITIAL_PLAYER_STATE } from './playerReducer';

export interface SavedPrefs {
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
}

export interface SavedQueue {
  queue: QueueEntry[];
  originalQueue: QueueEntry[] | null;
  currentIndex: number;
  context: PlaybackContext | null;
  position: number;
}

export function parsePrefs(raw: unknown): SavedPrefs | null {
  if (!isRecord(raw)) return null;
  return {
    volume: clampNumber(raw.volume, 0, 1, INITIAL_PLAYER_STATE.volume),
    muted: isBoolean(raw.muted) ? raw.muted : false,
    shuffle: isBoolean(raw.shuffle) ? raw.shuffle : false,
    repeat: oneOf(raw.repeat, ['off', 'all', 'one'] as const, 'off'),
  };
}

function parseEntries(raw: unknown): QueueEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (entry): entry is Record<string, unknown> =>
        isRecord(entry) && isString(entry.uid) && isString(entry.trackId),
    )
    .map((entry) => ({
      uid: entry.uid as string,
      trackId: entry.trackId as string,
      origin: oneOf(entry.origin, ['context', 'user'] as const, 'context'),
    }));
}

function parseContext(raw: unknown): PlaybackContext | null {
  if (!isRecord(raw) || !isString(raw.type) || !isString(raw.title)) return null;
  return {
    type: oneOf(
      raw.type,
      [
        'album',
        'artist',
        'playlist',
        'liked',
        'recent',
        'genre',
        'search',
        'discover',
        'autoplay',
        'queue',
      ] as const,
      'queue',
    ),
    id: isString(raw.id) ? raw.id : null,
    title: raw.title,
    path: isString(raw.path) ? raw.path : null,
  };
}

export function parseSavedQueue(raw: unknown): SavedQueue | null {
  if (!isRecord(raw)) return null;
  return {
    queue: parseEntries(raw.queue),
    originalQueue: raw.originalQueue === null ? null : parseEntries(raw.originalQueue),
    currentIndex: clampNumber(raw.currentIndex, -1, 10_000, -1),
    context: parseContext(raw.context),
    position: clampNumber(raw.position, 0, 24 * 3600, 0),
  };
}

/**
 * Buduje stan początkowy odtwarzacza. Pomija utwory, których nie da się już odnaleźć,
 * i nigdy nie włącza muzyki automatycznie (przeglądarki i tak by na to nie pozwoliły).
 */
export function restorePlayerState(
  prefs: SavedPrefs | null,
  saved: SavedQueue | null,
  isResolvable: (trackId: string) => boolean,
): PlayerState {
  const base: PlayerState = { ...INITIAL_PLAYER_STATE, ...(prefs ?? {}) };
  if (!saved || saved.queue.length === 0) return { ...base, shuffle: prefs?.shuffle ?? false };
  const current = saved.queue[saved.currentIndex];
  const queue = saved.queue.filter((entry) => isResolvable(entry.trackId));
  if (queue.length === 0) return base;
  const currentIndex = Math.max(0, current ? queue.findIndex((entry) => entry.uid === current.uid) : 0);
  const keepPosition = current !== undefined && queue[currentIndex]?.uid === current.uid;
  const originalQueue =
    base.shuffle && saved.originalQueue
      ? saved.originalQueue.filter((entry) => isResolvable(entry.trackId))
      : null;
  return {
    ...base,
    queue,
    originalQueue,
    currentIndex,
    context: saved.context,
    status: 'paused',
    resumeAt: keepPosition ? saved.position : 0,
  };
}
