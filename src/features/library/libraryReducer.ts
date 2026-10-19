// Stan biblioteki użytkownika: własne playlisty, ulubione, historia odtwarzania
// i ostatnie wyszukiwania. Czysty reducer + funkcja sprawdzająca dane z localStorage.

import type { Track, UserPlaylist, UserPlaylistItem } from '../../types/music';
import { isFiniteNumber, isRecord, isString, isStringArray } from '../../utils/validation';

export interface LikedEntry {
  trackId: string;
  addedAt: string;
}

export interface RecentEntry {
  trackId: string;
  playedAt: string;
}

export interface LibraryState {
  playlists: UserPlaylist[];
  /** Najnowsze na początku. */
  liked: LikedEntry[];
  /** Najnowsze na początku, bez powtórzeń. */
  recent: RecentEntry[];
  recentSearches: string[];
  /** Utwory spoza katalogu (np. z Openverse), które użytkownik polubił, dodał lub odtworzył. */
  externalTracks: Record<string, Track>;
}

export const MAX_RECENT = 50;
export const MAX_RECENT_SEARCHES = 8;
export const MAX_TITLE_LENGTH = 80;
export const MAX_DESCRIPTION_LENGTH = 300;

export const EMPTY_LIBRARY: LibraryState = {
  playlists: [],
  liked: [],
  recent: [],
  recentSearches: [],
  externalTracks: {},
};

export type LibraryAction =
  | {
      type: 'createPlaylist';
      id: string;
      title: string;
      description: string;
      trackIds: string[];
      now: string;
    }
  | { type: 'updatePlaylist'; id: string; title: string; description: string; now: string }
  | { type: 'deletePlaylist'; id: string }
  | { type: 'addToPlaylist'; playlistId: string; trackIds: string[]; now: string }
  | { type: 'removeFromPlaylist'; playlistId: string; trackId: string; now: string }
  | { type: 'setLiked'; trackId: string; liked: boolean; addedAt: string }
  | { type: 'recordPlay'; trackId: string; now: string }
  | { type: 'clearRecent' }
  | { type: 'addRecentSearch'; query: string }
  | { type: 'removeRecentSearch'; query: string }
  | { type: 'clearRecentSearches' }
  | { type: 'rememberTracks'; tracks: Track[] }
  | { type: 'reset' };

function cleanTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ').slice(0, MAX_TITLE_LENGTH);
}

function cleanDescription(description: string): string {
  return description.trim().slice(0, MAX_DESCRIPTION_LENGTH);
}

function uniqueNewItems(existing: UserPlaylistItem[], trackIds: string[], now: string): UserPlaylistItem[] {
  const present = new Set(existing.map((item) => item.trackId));
  const result: UserPlaylistItem[] = [];
  for (const trackId of trackIds) {
    if (present.has(trackId)) continue;
    present.add(trackId);
    result.push({ trackId, addedAt: now });
  }
  return result;
}

export function libraryReducer(state: LibraryState, action: LibraryAction): LibraryState {
  switch (action.type) {
    case 'createPlaylist': {
      const title = cleanTitle(action.title);
      if (!title) return state;
      const playlist: UserPlaylist = {
        id: action.id,
        title,
        description: cleanDescription(action.description),
        items: uniqueNewItems([], action.trackIds, action.now),
        createdAt: action.now,
        updatedAt: action.now,
      };
      return { ...state, playlists: [playlist, ...state.playlists] };
    }

    case 'updatePlaylist': {
      const title = cleanTitle(action.title);
      if (!title) return state;
      return {
        ...state,
        playlists: state.playlists.map((playlist) =>
          playlist.id === action.id
            ? { ...playlist, title, description: cleanDescription(action.description), updatedAt: action.now }
            : playlist,
        ),
      };
    }

    case 'deletePlaylist':
      return { ...state, playlists: state.playlists.filter((playlist) => playlist.id !== action.id) };

    case 'addToPlaylist':
      return {
        ...state,
        playlists: state.playlists.map((playlist) => {
          if (playlist.id !== action.playlistId) return playlist;
          const added = uniqueNewItems(playlist.items, action.trackIds, action.now);
          return added.length === 0
            ? playlist
            : { ...playlist, items: [...playlist.items, ...added], updatedAt: action.now };
        }),
      };

    case 'removeFromPlaylist':
      return {
        ...state,
        playlists: state.playlists.map((playlist) =>
          playlist.id === action.playlistId
            ? {
                ...playlist,
                items: playlist.items.filter((item) => item.trackId !== action.trackId),
                updatedAt: action.now,
              }
            : playlist,
        ),
      };

    case 'setLiked': {
      const without = state.liked.filter((entry) => entry.trackId !== action.trackId);
      if (!action.liked) return without.length === state.liked.length ? state : { ...state, liked: without };
      if (without.length !== state.liked.length) return state;
      // Zachowujemy kolejność od najnowszych (ważne przy cofaniu usunięcia).
      const liked = [...without, { trackId: action.trackId, addedAt: action.addedAt }].sort((a, b) =>
        b.addedAt.localeCompare(a.addedAt),
      );
      return { ...state, liked };
    }

    case 'recordPlay': {
      const recent = [
        { trackId: action.trackId, playedAt: action.now },
        ...state.recent.filter((entry) => entry.trackId !== action.trackId),
      ].slice(0, MAX_RECENT);
      return { ...state, recent };
    }

    case 'clearRecent':
      return { ...state, recent: [] };

    case 'addRecentSearch': {
      const query = action.query.trim();
      if (query.length < 2) return state;
      const recentSearches = [
        query,
        ...state.recentSearches.filter((item) => item.toLowerCase() !== query.toLowerCase()),
      ].slice(0, MAX_RECENT_SEARCHES);
      return { ...state, recentSearches };
    }

    case 'removeRecentSearch':
      return { ...state, recentSearches: state.recentSearches.filter((item) => item !== action.query) };

    case 'clearRecentSearches':
      return { ...state, recentSearches: [] };

    case 'rememberTracks': {
      const additions = action.tracks.filter(
        (track) => track.source === 'openverse' && !state.externalTracks[track.id],
      );
      if (additions.length === 0) return state;
      const externalTracks = { ...state.externalTracks };
      additions.forEach((track) => {
        externalTracks[track.id] = track;
      });
      return { ...state, externalTracks };
    }

    case 'reset':
      return EMPTY_LIBRARY;

    default:
      return state;
  }
}

// ---------------------------------------------------------------- odczyt z localStorage

function parsePlaylist(raw: unknown): UserPlaylist | null {
  if (!isRecord(raw) || !isString(raw.id) || !isString(raw.title) || !raw.title.trim()) return null;
  const items = Array.isArray(raw.items)
    ? raw.items.filter(
        (item): item is UserPlaylistItem =>
          isRecord(item) && isString(item.trackId) && isString(item.addedAt),
      )
    : [];
  return {
    id: raw.id,
    title: cleanTitle(raw.title),
    description: isString(raw.description) ? cleanDescription(raw.description) : '',
    items,
    createdAt: isString(raw.createdAt) ? raw.createdAt : new Date(0).toISOString(),
    updatedAt: isString(raw.updatedAt) ? raw.updatedAt : new Date(0).toISOString(),
  };
}

function parseTrack(raw: unknown): Track | null {
  if (!isRecord(raw) || !isString(raw.id) || !isString(raw.title) || !isString(raw.audioUrl)) return null;
  if (raw.source !== 'openverse' || !isString(raw.artistName) || !isFiniteNumber(raw.durationSec))
    return null;
  return raw as unknown as Track;
}

/**
 * Sprawdza dane odczytane z pamięci. Uszkodzone pojedyncze wpisy są pomijane,
 * a poprawne zostają zachowane (zamiast kasowania całej biblioteki).
 */
export function parseLibrary(raw: unknown): LibraryState | null {
  if (!isRecord(raw)) return null;
  const playlists = Array.isArray(raw.playlists)
    ? raw.playlists.map(parsePlaylist).filter((playlist): playlist is UserPlaylist => playlist !== null)
    : [];
  const liked = Array.isArray(raw.liked)
    ? raw.liked.filter(
        (entry): entry is LikedEntry => isRecord(entry) && isString(entry.trackId) && isString(entry.addedAt),
      )
    : [];
  const recent = Array.isArray(raw.recent)
    ? raw.recent
        .filter(
          (entry): entry is RecentEntry =>
            isRecord(entry) && isString(entry.trackId) && isString(entry.playedAt),
        )
        .slice(0, MAX_RECENT)
    : [];
  const recentSearches = isStringArray(raw.recentSearches)
    ? raw.recentSearches.slice(0, MAX_RECENT_SEARCHES)
    : [];

  // Zachowujemy tylko te zewnętrzne utwory, do których coś się jeszcze odwołuje.
  const referenced = new Set([
    ...playlists.flatMap((playlist) => playlist.items.map((item) => item.trackId)),
    ...liked.map((entry) => entry.trackId),
    ...recent.map((entry) => entry.trackId),
  ]);
  const externalTracks: Record<string, Track> = {};
  if (isRecord(raw.externalTracks)) {
    for (const [id, value] of Object.entries(raw.externalTracks)) {
      const track = parseTrack(value);
      if (track && referenced.has(id)) externalTracks[id] = track;
    }
  }
  return { playlists, liked, recent, recentSearches, externalTracks };
}
