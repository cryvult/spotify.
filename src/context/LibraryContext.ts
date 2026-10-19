import { createContext, useContext } from 'react';
import type { LibraryState } from '../features/library/libraryReducer';
import type { Track, UserPlaylist } from '../types/music';

export interface PlaylistInput {
  title: string;
  description: string;
  trackIds?: string[];
}

export interface LibraryContextValue extends LibraryState {
  likedIds: ReadonlySet<string>;
  isLiked: (trackId: string) => boolean;
  /** Przełącza polubienie i zwraca nowy stan (true = polubiony). */
  toggleLike: (track: Track) => boolean;
  setLiked: (track: Track, liked: boolean, addedAt?: string) => void;
  createPlaylist: (input: PlaylistInput, tracks?: Track[]) => string | null;
  updatePlaylist: (id: string, input: PlaylistInput) => void;
  deletePlaylist: (id: string) => void;
  /** Dodaje utwory i zwraca, ile dodano, a ile pominięto jako duplikaty. */
  addToPlaylist: (playlistId: string, tracks: Track[]) => { added: number; skipped: number };
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  getPlaylist: (id: string) => UserPlaylist | undefined;
  /** Znajduje utwór w katalogu albo wśród zapamiętanych utworów zewnętrznych. */
  resolveTrack: (trackId: string) => Track | undefined;
  resolveTracks: (trackIds: readonly string[]) => Track[];
  rememberTracks: (tracks: Track[]) => void;
  recordPlay: (track: Track) => void;
  clearRecent: () => void;
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  resetLibrary: () => void;
}

export const LibraryContext = createContext<LibraryContextValue | null>(null);

export function useLibrary(): LibraryContextValue {
  const value = useContext(LibraryContext);
  if (!value) throw new Error('useLibrary musi być użyte wewnątrz <LibraryProvider>.');
  return value;
}
