import { Pause, Play } from 'lucide-react';
import { CoverImage } from '../../components/music/CoverImage';
import { Equalizer } from '../../components/music/Equalizer';
import { usePlayerState } from '../../context/PlayerContext';
import { useCollectionPlayback } from '../../hooks/useCollectionPlayback';
import type { Track } from '../../types/music';
import { formatDuration } from '../../utils/formatDuration';
import styles from './PopularTracks.module.css';

/** Ranking popularnych utworów w dwóch kolumnach (inny układ niż półki z kartami). */
export function PopularTracks({ tracks }: { tracks: Track[] }) {
  const { currentTrack, isPlaying } = usePlayerState();
  const playback = useCollectionPlayback(
    { type: 'playlist', id: 'popular-now', title: 'Popularne teraz', path: '/' },
    tracks,
  );

  return (
    <ol className={styles.list} aria-label="Popularne utwory">
      {tracks.map((track, index) => {
        const isCurrent = currentTrack?.id === track.id;
        const playingNow = isCurrent && isPlaying;
        return (
          <li key={track.id}>
            <button
              type="button"
              className={`${styles.item} ${isCurrent ? styles.current : ''}`}
              onClick={() =>
                isCurrent && playback.isActive ? playback.togglePlay() : playback.playAt(index)
              }
              aria-label={`${playingNow ? 'Wstrzymaj' : 'Odtwórz'}: ${track.title}, ${track.artistName}`}
            >
              <span className={styles.rank} aria-hidden>
                {isCurrent ? <Equalizer playing={playingNow} /> : index + 1}
              </span>
              <span className={styles.coverWrap}>
                <CoverImage src={track.coverUrl} alt="" size={96} className={styles.cover} />
                <span className={styles.overlay} aria-hidden>
                  {playingNow ? (
                    <Pause size={16} fill="currentColor" />
                  ) : (
                    <Play size={16} fill="currentColor" />
                  )}
                </span>
              </span>
              <span className={styles.text}>
                <span className={styles.title}>{track.title}</span>
                <span className={styles.artist}>{track.artistName}</span>
              </span>
              <span className={styles.duration}>{formatDuration(track.durationSec)}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
