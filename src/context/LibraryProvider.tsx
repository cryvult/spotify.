import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { getTrack } from '../data/catalog';
import { EMPTY_LIBRARY, libraryReducer, parseLibrary } from '../features/library/libraryReducer';
import { readStorage, STORAGE_KEYS, writeStorage } from '../services/storageService';
import type { Track } from '../types/music';
import { createId } from '../utils/createId';
import { LibraryContext, type LibraryContextValue, type PlaylistInput } from './LibraryContext';

const now = () => new Date().toISOString();

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(libraryReducer, undefined, () =>
    readStorage(STORAGE_KEYS.library, parseLibrary, EMPTY_LIBRARY),
  );
  // Aktualny stan dostępny w funkcjach bez ich ponownego tworzenia.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
    writeStorage(STORAGE_KEYS.library, state);
  }, [state]);

  const likedIds = useMemo(() => new Set(state.liked.map((entry) => entry.trackId)), [state.liked]);

  const resolveTrack = useCallback(
    (trackId: string) => getTrack(trackId) ?? state.externalTracks[trackId],
    [state.externalTracks],
  );

  const resolveTracks = useCallback(
    (trackIds: readonly string[]) =>
      trackIds.map((id) => resolveTrack(id)).filter((track): track is Track => track !== undefined),
    [resolveTrack],
  );

  const rememberTracks = useCallback((tracks: Track[]) => dispatch({ type: 'rememberTracks', tracks }), []);

  const setLiked = useCallback(
    (track: Track, liked: boolean, addedAt?: string) => {
      if (liked) rememberTracks([track]);
      dispatch({ type: 'setLiked', trackId: track.id, liked, addedAt: addedAt ?? now() });
    },
    [rememberTracks],
  );

  const toggleLike = useCallback(
    (track: Track) => {
      const liked = !stateRef.current.liked.some((entry) => entry.trackId === track.id);
      setLiked(track, liked);
      return liked;
    },
    [setLiked],
  );

  const createPlaylist = useCallback(
    (input: PlaylistInput, tracks: Track[] = []) => {
      if (!input.title.trim()) return null;
      const id = createId('pl');
      rememberTracks(tracks);
      dispatch({
        type: 'createPlaylist',
        id,
        title: input.title,
        description: input.description,
        trackIds: input.trackIds ?? tracks.map((track) => track.id),
        now: now(),
      });
      return id;
    },
    [rememberTracks],
  );

  const addToPlaylist = useCallback(
    (playlistId: string, tracks: Track[]) => {
      const playlist = stateRef.current.playlists.find((item) => item.id === playlistId);
      if (!playlist) return { added: 0, skipped: tracks.length };
      const present = new Set(playlist.items.map((item) => item.trackId));
      const fresh = [
        ...new Map(tracks.filter((track) => !present.has(track.id)).map((t) => [t.id, t])).values(),
      ];
      rememberTracks(fresh);
      dispatch({ type: 'addToPlaylist', playlistId, trackIds: fresh.map((track) => track.id), now: now() });
      return { added: fresh.length, skipped: tracks.length - fresh.length };
    },
    [rememberTracks],
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      ...state,
      likedIds,
      isLiked: (trackId) => likedIds.has(trackId),
      toggleLike,
      setLiked,
      createPlaylist,
      updatePlaylist: (id, input) =>
        dispatch({
          type: 'updatePlaylist',
          id,
          title: input.title,
          description: input.description,
          now: now(),
        }),
      deletePlaylist: (id) => dispatch({ type: 'deletePlaylist', id }),
      addToPlaylist,
      removeFromPlaylist: (playlistId, trackId) =>
        dispatch({ type: 'removeFromPlaylist', playlistId, trackId, now: now() }),
      getPlaylist: (id) => state.playlists.find((playlist) => playlist.id === id),
      resolveTrack,
      resolveTracks,
      rememberTracks,
      recordPlay: (track) => {
        rememberTracks([track]);
        dispatch({ type: 'recordPlay', trackId: track.id, now: now() });
      },
      clearRecent: () => dispatch({ type: 'clearRecent' }),
      addRecentSearch: (query) => dispatch({ type: 'addRecentSearch', query }),
      removeRecentSearch: (query) => dispatch({ type: 'removeRecentSearch', query }),
      clearRecentSearches: () => dispatch({ type: 'clearRecentSearches' }),
      resetLibrary: () => dispatch({ type: 'reset' }),
    }),
    [
      state,
      likedIds,
      toggleLike,
      setLiked,
      createPlaylist,
      addToPlaylist,
      resolveTrack,
      resolveTracks,
      rememberTracks,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
