import { isPlayingFrom, usePlayerControls, usePlayerState } from '../context/PlayerContext';
import type { Track } from '../types/music';
import type { PlaybackContext } from '../types/player';

/**
 * Logika przycisków odtwarzania dla albumu, playlisty, ulubionych itp.:
 * jeśli ta kolekcja już gra, przycisk działa jak pauza; w przeciwnym razie zaczyna od początku.
 */
export function useCollectionPlayback(context: PlaybackContext, tracks: Track[]) {
  const { state, isPlaying, isBuffering } = usePlayerState();
  const controls = usePlayerControls();
  const isActive = isPlayingFrom(state, context.type, context.id);

  return {
    isActive,
    isPlaying: isActive && isPlaying,
    isBuffering: isActive && isBuffering,
    toggle: () => {
      if (isActive) controls.togglePlay();
      else controls.playTracks(tracks, { context, startIndex: 0 });
    },
    playAt: (index: number) => controls.playTracks(tracks, { context, startIndex: index }),
    shuffle: () =>
      controls.playTracks(tracks, {
        context,
        shuffle: true,
        startIndex: Math.floor(Math.random() * tracks.length),
      }),
    togglePlay: controls.togglePlay,
  };
}
