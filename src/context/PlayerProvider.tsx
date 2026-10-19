// PlayerProvider łączy trzy elementy:
// 1) stan kolejki (playerReducer),
// 2) jedyny w aplikacji silnik audio (AudioEngine),
// 3) resztę aplikacji (biblioteka, ustawienia, powiadomienia, Media Session API).

import { useEffect, useEffectEvent, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import {
  parsePrefs,
  parseSavedQueue,
  restorePlayerState,
  type SavedQueue,
} from '../features/player/playerPersistence';
import { getCurrentEntry, getUpcoming, playerReducer } from '../features/player/playerReducer';
import { recommendTracks } from '../features/player/recommendations';
import { AudioEngine, canControlVolume } from '../services/audioEngine';
import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from '../services/storageService';
import type { Track } from '../types/music';
import type { QueueEntry } from '../types/player';
import { createId } from '../utils/createId';
import { useLibrary } from './LibraryContext';
import {
  PlayerControlsContext,
  PlayerEngineContext,
  PlayerStateContext,
  type PlayerControls,
  type PlayerStateValue,
} from './PlayerContext';
import { useSettings } from './SettingsContext';
import { useToast } from './ToastContext';

/** Po tylu sekundach przycisk „Poprzedni” zaczyna utwór od nowa zamiast cofać. */
const RESTART_THRESHOLD = 3;
const TAB_ID = createId('tab');

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

function toEntries(tracks: Track[], origin: QueueEntry['origin']): QueueEntry[] {
  return tracks.map((track) => ({ uid: createId('q'), trackId: track.id, origin }));
}

interface PlayerProviderProps {
  children: ReactNode;
  /** Pozwala podstawić w testach własny silnik audio. */
  createEngine?: () => AudioEngine;
}

export function PlayerProvider({ children, createEngine = () => new AudioEngine() }: PlayerProviderProps) {
  const { settings } = useSettings();
  const { resolveTrack, rememberTracks, recordPlay } = useLibrary();
  const { showToast } = useToast();
  const [engine] = useState(createEngine);
  const [volumeControllable] = useState(canControlVolume);

  const [state, dispatch] = useReducer(playerReducer, undefined, () =>
    restorePlayerState(
      readStorage(STORAGE_KEYS.playerPrefs, parsePrefs, null),
      settings.rememberQueue
        ? readStorage<SavedQueue | null>(STORAGE_KEYS.player, parseSavedQueue, null)
        : null,
      (trackId) => resolveTrack(trackId) !== undefined,
    ),
  );

  const currentEntry = getCurrentEntry(state);
  const currentTrack = currentEntry ? (resolveTrack(currentEntry.trackId) ?? null) : null;
  const isPlaying = state.status === 'playing' || (state.wantsToPlay && state.status === 'loading');
  const isBuffering = state.wantsToPlay && state.status === 'loading';
  const recordedKey = useRef<string | null>(null);
  const channel = useRef<BroadcastChannel | null>(null);

  // ------------------------------------------------------------ zdarzenia silnika

  const playSafely = useEffectEvent(async () => {
    const result = await engine.play();
    if (result === 'blocked') {
      dispatch({ type: 'playBlocked' });
      showToast({
        message:
          'Przeglądarka wstrzymała automatyczne odtwarzanie. Kliknij przycisk odtwarzania, aby kontynuować.',
      });
    } else if (result === 'failed' && engine.isPaused()) {
      dispatch({ type: 'engineError', message: 'Nie udało się rozpocząć odtwarzania.' });
    }
  });

  const handlePlaying = useEffectEvent(() => {
    dispatch({ type: 'enginePlaying' });
    channel.current?.postMessage({ type: 'playing', tabId: TAB_ID });
    // Do historii trafia każdy utwór raz na jedno uruchomienie.
    const key = `${currentEntry?.uid}:${state.loadToken}`;
    if (currentTrack && recordedKey.current !== key) {
      recordedKey.current = key;
      recordPlay(currentTrack);
    }
  });

  const handleEnded = useEffectEvent(() => {
    if (state.repeat === 'one') {
      engine.seek(0);
      void playSafely();
      return;
    }
    const atEnd = state.currentIndex >= state.queue.length - 1;
    if (atEnd && state.repeat === 'off' && settings.autoplay) {
      const excludeIds = new Set(state.queue.map((entry) => entry.trackId));
      const tracks = recommendTracks({ seedTrack: currentTrack, excludeIds, limit: 5 });
      if (tracks.length > 0) {
        dispatch({
          type: 'appendAutoplay',
          entries: toEntries(tracks, 'context'),
          context: { type: 'autoplay', id: null, title: 'Autoodtwarzanie: podobne utwory', path: null },
        });
        return;
      }
    }
    dispatch({ type: 'next', auto: true });
  });

  const handleError = useEffectEvent((message: string) => {
    dispatch({ type: 'engineError', message });
    const title = currentTrack ? `„${currentTrack.title}”` : 'utworu';
    const offline =
      typeof navigator !== 'undefined' && !navigator.onLine && currentTrack?.source !== 'generated';
    const hasNext = state.currentIndex < state.queue.length - 1;
    showToast({
      tone: 'error',
      duration: 8000,
      message: offline
        ? `Brak połączenia z internetem. Utwór ${title} pochodzi z zewnętrznego źródła.`
        : `Nie można odtworzyć ${title}. ${message}`,
      action: hasNext
        ? { label: 'Pomiń', onClick: () => dispatch({ type: 'next', auto: false }) }
        : undefined,
    });
  });

  useEffect(() => {
    engine.attach();
    const unsubscribe = engine.subscribe((event) => {
      switch (event.type) {
        case 'loading':
        case 'waiting':
          dispatch({ type: 'engineLoading' });
          break;
        case 'ready':
          dispatch({ type: 'engineReady' });
          break;
        case 'playing':
          handlePlaying();
          break;
        case 'paused':
          dispatch({ type: 'enginePaused' });
          break;
        case 'ended':
          handleEnded();
          break;
        case 'error':
          handleError(event.message);
          break;
      }
    });
    return () => {
      unsubscribe();
      engine.detach();
    };
  }, [engine]);

  // ------------------------------------------------------------ sterowanie silnikiem

  const currentUid = currentEntry?.uid ?? null;
  const currentAudioUrl = currentTrack?.audioUrl ?? null;

  const loadCurrent = useEffectEvent(() => {
    if (!currentAudioUrl) return;
    engine.load(currentAudioUrl, state.resumeAt);
    if (state.wantsToPlay) void playSafely();
  });

  // Nowy utwór (lub ponowne wczytanie tego samego) => wczytaj plik.
  useEffect(() => {
    loadCurrent();
  }, [currentUid, currentAudioUrl, state.loadToken]);

  // Zmiana zamiaru „graj / pauza”.
  const syncPlayback = useEffectEvent(() => {
    if (!currentUid) return;
    if (state.wantsToPlay && engine.isPaused()) void playSafely();
    if (!state.wantsToPlay && !engine.isPaused()) engine.pause();
  });

  useEffect(() => {
    syncPlayback();
  }, [state.wantsToPlay]);

  useEffect(() => {
    engine.setVolume(state.volume);
    engine.setMuted(state.muted);
  }, [engine, state.volume, state.muted]);

  // ------------------------------------------------------------ zapisywanie stanu

  useEffect(() => {
    writeStorage(STORAGE_KEYS.playerPrefs, {
      volume: state.volume,
      muted: state.muted,
      shuffle: state.shuffle,
      repeat: state.repeat,
    });
  }, [state.volume, state.muted, state.shuffle, state.repeat]);

  const saveQueue = useEffectEvent(() => {
    if (!settings.rememberQueue) {
      removeStorage(STORAGE_KEYS.player);
      return;
    }
    const snapshot: SavedQueue = {
      queue: state.queue,
      originalQueue: state.originalQueue,
      currentIndex: state.currentIndex,
      context: state.context,
      position: engine.getCurrentTime(),
    };
    writeStorage(STORAGE_KEYS.player, snapshot);
  });

  useEffect(() => {
    saveQueue();
  }, [
    state.queue,
    state.originalQueue,
    state.currentIndex,
    state.context,
    state.status,
    settings.rememberQueue,
  ]);

  // Pozycję w utworze zapisujemy co kilka sekund oraz przy zamykaniu karty.
  useEffect(() => {
    const onPageHide = () => saveQueue();
    window.addEventListener('pagehide', onPageHide);
    const timer = state.status === 'playing' ? window.setInterval(() => saveQueue(), 5000) : undefined;
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      window.clearInterval(timer);
    };
  }, [state.status]);

  // ------------------------------------------------------------ jedna karta gra naraz

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const broadcast = new BroadcastChannel('sonora-playback');
    channel.current = broadcast;
    broadcast.onmessage = (event: MessageEvent<{ type?: string; tabId?: string }>) => {
      if (event.data.type === 'playing' && event.data.tabId !== TAB_ID) {
        dispatch({ type: 'setWantsToPlay', value: false });
      }
    };
    return () => {
      broadcast.close();
      channel.current = null;
    };
  }, []);

  // ------------------------------------------------------------ akcje

  // Aktualna głośność dla akcji changeVolumeBy (ref, aby obiekt akcji pozostał stały).
  const stateVolume = useRef(state.volume);
  useEffect(() => {
    stateVolume.current = state.volume;
  }, [state.volume]);

  const controls = useMemo<PlayerControls>(() => {
    const previous = () => {
      if (engine.getCurrentTime() > RESTART_THRESHOLD) engine.seek(0);
      else dispatch({ type: 'previous' });
    };
    return {
      playTracks: (tracks, options = {}) => {
        if (tracks.length === 0) return;
        rememberTracks(tracks);
        dispatch({
          type: 'playList',
          entries: toEntries(tracks, 'context'),
          startIndex: options.startIndex ?? 0,
          context: options.context ?? null,
          shuffle: options.shuffle,
          seed: randomSeed(),
        });
      },
      togglePlay: () => dispatch({ type: 'togglePlay' }),
      play: () => dispatch({ type: 'setWantsToPlay', value: true }),
      pause: () => dispatch({ type: 'setWantsToPlay', value: false }),
      next: () => dispatch({ type: 'next', auto: false }),
      previous,
      seek: (seconds) => engine.seek(seconds),
      seekBy: (delta) => engine.seek(engine.getCurrentTime() + delta),
      jumpTo: (uid) => dispatch({ type: 'jumpTo', uid }),
      addToQueue: (tracks) => {
        rememberTracks(tracks);
        dispatch({ type: 'enqueue', entries: toEntries(tracks, 'user'), position: 'last' });
      },
      playNext: (tracks) => {
        rememberTracks(tracks);
        dispatch({ type: 'enqueue', entries: toEntries(tracks, 'user'), position: 'next' });
      },
      removeFromQueue: (uid) => dispatch({ type: 'remove', uid }),
      clearUpcoming: () => dispatch({ type: 'clearUpcoming' }),
      toggleShuffle: () => dispatch({ type: 'toggleShuffle', seed: randomSeed() }),
      cycleRepeat: () => dispatch({ type: 'cycleRepeat' }),
      setVolume: (volume) => dispatch({ type: 'setVolume', volume }),
      changeVolumeBy: (delta) => dispatch({ type: 'setVolume', volume: stateVolume.current + delta }),
      toggleMute: () => dispatch({ type: 'toggleMute' }),
      retry: () => dispatch({ type: 'retry' }),
      stopAndClear: () => {
        engine.pause();
        dispatch({ type: 'reset' });
      },
      canControlVolume: volumeControllable,
    };
  }, [engine, rememberTracks, volumeControllable]);

  // ------------------------------------------------------------ Media Session (klawisze multimedialne, ekran blokady)

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!currentTrack) {
      navigator.mediaSession.metadata = null;
      return;
    }
    const artwork = currentTrack.coverUrl
      ? [{ src: new URL(currentTrack.coverUrl, document.baseURI).href, sizes: '600x600' }]
      : [];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artistName,
      album: currentTrack.albumTitle ?? '',
      artwork,
    });
  }, [currentTrack]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = currentTrack ? (isPlaying ? 'playing' : 'paused') : 'none';
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ['play', () => controls.play()],
      ['pause', () => controls.pause()],
      ['nexttrack', () => controls.next()],
      ['previoustrack', () => controls.previous()],
      ['seekto', (details) => details.seekTime !== undefined && controls.seek(details.seekTime)],
    ];
    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Niektóre przeglądarki nie obsługują wszystkich akcji.
      }
    }
    return () => {
      for (const [action] of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // jak wyżej
        }
      }
    };
  }, [controls]);

  // ------------------------------------------------------------ wartości dla komponentów

  const upcoming = useMemo(
    () =>
      getUpcoming(state)
        .map((entry) => ({ entry, track: resolveTrack(entry.trackId) }))
        .filter((item): item is { entry: QueueEntry; track: Track } => item.track !== undefined),
    [state, resolveTrack],
  );

  const stateValue = useMemo<PlayerStateValue>(
    () => ({
      state,
      currentEntry,
      currentTrack,
      upcoming,
      isPlaying,
      isBuffering,
      hasNext: state.currentIndex < state.queue.length - 1 || state.repeat === 'all',
    }),
    [state, currentEntry, currentTrack, upcoming, isPlaying, isBuffering],
  );

  return (
    <PlayerEngineContext.Provider value={engine}>
      <PlayerControlsContext.Provider value={controls}>
        <PlayerStateContext.Provider value={stateValue}>{children}</PlayerStateContext.Provider>
      </PlayerControlsContext.Provider>
    </PlayerEngineContext.Provider>
  );
}
