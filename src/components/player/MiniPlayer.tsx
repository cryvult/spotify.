import { usePlaybackProgress, usePlayerControls, usePlayerState } from '../../context/PlayerContext';
import { useUI } from '../../context/UIContext';
import { CoverImage } from '../music/CoverImage';
import { LikeButton } from '../music/LikeButton';
import { PlayButton } from '../music/PlayButton';
import styles from './MiniPlayer.module.css';

/** Uproszczony odtwarzacz na telefonach. Dotknięcie otwiera pełny widok odtwarzania. */
export function MiniPlayer() {
  const { currentTrack, isPlaying, isBuffering, state } = usePlayerState();
  const { togglePlay } = usePlayerControls();
  const { setNowPlayingOpen } = useUI();

  if (!currentTrack) return null;

  return (
    <section
      className={`${styles.mini} ${state.status === 'error' ? styles.error : ''}`}
      aria-label="Odtwarzacz"
    >
      <button
        type="button"
        className={styles.open}
        onClick={() => setNowPlayingOpen(true)}
        aria-label={`Otwórz odtwarzacz: ${currentTrack.title}, ${currentTrack.artistName}`}
      >
        <CoverImage src={currentTrack.coverUrl} alt="" size={80} className={styles.cover} />
        <span className={styles.text}>
          <span className={styles.title}>{currentTrack.title}</span>
          <span className={styles.artist}>
            {state.status === 'error'
              ? 'Nie można odtworzyć: dotknij, aby zobaczyć'
              : currentTrack.artistName}
          </span>
        </span>
      </button>
      <LikeButton track={currentTrack} />
      <PlayButton
        playing={isPlaying}
        buffering={isBuffering}
        label={isPlaying ? 'Wstrzymaj' : 'Odtwórz'}
        size="sm"
        className={styles.play}
        onClick={togglePlay}
      />
      <MiniProgress />
    </section>
  );
}

/** Cienka linia postępu na dole mini odtwarzacza (osobny komponent: tylko on odświeża się co chwilę). */
function MiniProgress() {
  const { currentTime, duration } = usePlaybackProgress();
  const percent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  return (
    <span className={styles.progress} aria-hidden>
      <span className={styles.progressFill} style={{ transform: `scaleX(${percent / 100})` }} />
    </span>
  );
}
