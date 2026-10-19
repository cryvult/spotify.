import { ListMusic } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import type { UserPlaylist } from '../../types/music';
import { CoverImage } from './CoverImage';
import styles from './PlaylistCover.module.css';

interface PlaylistCoverProps {
  playlist: UserPlaylist;
  size?: number;
  className?: string;
}

/**
 * Okładka playlisty użytkownika: mozaika z okładek pierwszych czterech różnych albumów
 * (jak w popularnych serwisach), pojedyncza okładka albo grafika dla pustej playlisty.
 */
export function PlaylistCover({ playlist, size = 300, className }: PlaylistCoverProps) {
  const { resolveTracks } = useLibrary();
  const covers = [
    ...new Set(
      resolveTracks(playlist.items.map((item) => item.trackId))
        .map((track) => track.coverUrl)
        .filter((url): url is string => url !== null),
    ),
  ].slice(0, 4);

  if (covers.length === 0) {
    return (
      <div
        className={`${styles.empty} ${className ?? ''}`}
        role="img"
        aria-label={`Okładka playlisty ${playlist.title}`}
      >
        <ListMusic size={Math.max(20, Math.round(size / 5))} aria-hidden />
      </div>
    );
  }
  if (covers.length < 4) {
    return (
      <CoverImage
        src={covers[0] ?? null}
        alt={`Okładka playlisty ${playlist.title}`}
        size={size}
        className={className}
      />
    );
  }
  return (
    <div
      className={`${styles.mosaic} ${className ?? ''}`}
      role="img"
      aria-label={`Okładka playlisty ${playlist.title}`}
    >
      {covers.map((url) => (
        <img key={url} src={url} alt="" width={size / 2} height={size / 2} loading="lazy" decoding="async" />
      ))}
    </div>
  );
}
