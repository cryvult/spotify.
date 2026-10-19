import { CoverImage } from '../../components/music/CoverImage';
import { PlayButton } from '../../components/music/PlayButton';
import { getTracksByIds } from '../../data/catalog';
import { useCollectionPlayback } from '../../hooks/useCollectionPlayback';
import type { FeaturedPlaylist } from '../../types/music';
import { Link } from 'react-router';
import type { CSSProperties } from 'react';
import styles from './ActivityBanners.module.css';

/** Szerokie kafelki „Muzyka do nauki, pracy, treningu i relaksu”. */
export function ActivityBanners({ playlists }: { playlists: FeaturedPlaylist[] }) {
  return (
    <div className={styles.grid}>
      {playlists.map((playlist) => (
        <ActivityBanner key={playlist.id} playlist={playlist} />
      ))}
    </div>
  );
}

function ActivityBanner({ playlist }: { playlist: FeaturedPlaylist }) {
  const playback = useCollectionPlayback(
    { type: 'playlist', id: playlist.id, title: playlist.title, path: `/playlist/${playlist.id}` },
    getTracksByIds(playlist.trackIds),
  );
  return (
    <article className={styles.banner} style={{ '--tone': playlist.accentColor } as CSSProperties}>
      <CoverImage src={playlist.coverUrl} alt="" size={200} className={styles.cover} />
      <div className={styles.text}>
        <h3 className={styles.title}>
          <Link to={`/playlist/${playlist.id}`} className={styles.link}>
            {playlist.title}
          </Link>
        </h3>
        <p className={styles.description}>{playlist.description}</p>
      </div>
      <PlayButton
        playing={playback.isPlaying}
        label={
          playback.isPlaying ? `Wstrzymaj playlistę ${playlist.title}` : `Odtwórz playlistę ${playlist.title}`
        }
        className={styles.play}
        onClick={playback.toggle}
      />
    </article>
  );
}
