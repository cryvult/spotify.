import { Link } from 'react-router';
import type { Track } from '../../types/music';
import { CoverImage } from '../music/CoverImage';
import { LikeButton } from '../music/LikeButton';
import styles from './TrackInfo.module.css';

/** Okładka, tytuł i wykonawca bieżącego utworu w dolnym odtwarzaczu. */
export function TrackInfo({ track }: { track: Track | null }) {
  if (!track) {
    return (
      <div className={styles.info}>
        <div className={styles.placeholder} aria-hidden />
        <p className={styles.empty}>Wybierz utwór, aby zacząć słuchać.</p>
      </div>
    );
  }
  return (
    <div className={styles.info}>
      <CoverImage
        src={track.coverUrl}
        alt={`Okładka: ${track.albumTitle ?? track.title}`}
        size={112}
        className={styles.cover}
        eager
      />
      <div className={styles.text}>
        {track.albumId ? (
          <Link to={`/album/${track.albumId}`} className={styles.title}>
            {track.title}
          </Link>
        ) : (
          <span className={styles.title}>{track.title}</span>
        )}
        {track.artistId ? (
          <Link to={`/artist/${track.artistId}`} className={styles.artist}>
            {track.artistName}
          </Link>
        ) : (
          <span className={styles.artist}>{track.artistName}</span>
        )}
      </div>
      <LikeButton track={track} />
    </div>
  );
}
