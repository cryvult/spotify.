import { Globe, Pause, Play } from 'lucide-react';
import { memo, useCallback, useState, type MouseEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Menu } from '../ui/Menu';
import { MenuButton } from '../ui/MenuButton';
import { useTrackMenu } from '../../hooks/useTrackMenu';
import type { Track } from '../../types/music';
import { formatDuration } from '../../utils/formatDuration';
import { formatRelativeDay } from '../../utils/formatDate';
import { CoverImage } from './CoverImage';
import { Equalizer } from './Equalizer';
import { LikeButton } from './LikeButton';
import styles from './TrackRow.module.css';

export interface TrackRowProps {
  track: Track;
  /** Numer wyświetlany w pierwszej kolumnie. */
  position: number;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlay: (track: Track) => void;
  showCover?: boolean;
  showAlbum?: boolean;
  /** Data dodania (playlisty, ulubione). undefined = kolumna ukryta. */
  addedAt?: string;
  onRemove?: (track: Track) => void;
  /** Fragmenty tytułu do podświetlenia (wyniki wyszukiwania). */
  renderTitle?: (title: string) => ReactNode;
}

function TrackRowComponent({
  track,
  position,
  isCurrent,
  isPlaying,
  onPlay,
  showCover = true,
  showAlbum = false,
  addedAt,
  onRemove,
  renderTitle,
}: TrackRowProps) {
  const [menuPoint, setMenuPoint] = useState<{ x: number; y: number } | null>(null);
  const items = useTrackMenu(track, { onRemoveFromPlaylist: onRemove ? () => onRemove(track) : undefined });
  const playingNow = isCurrent && isPlaying;
  const closeMenu = useCallback(() => setMenuPoint(null), []);

  // Na ekranach dotykowych dotknięcie wiersza odtwarza utwór (jak w aplikacjach mobilnych).
  const handleClick = (event: MouseEvent<HTMLLIElement>) => {
    const interactive = (event.target as HTMLElement).closest('button, a');
    if (!interactive && window.matchMedia('(hover: none)').matches) onPlay(track);
  };

  const classes = [
    styles.row,
    isCurrent ? styles.current : '',
    showAlbum ? styles.withAlbum : '',
    addedAt !== undefined ? styles.withAdded : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li
      className={classes}
      onDoubleClick={() => onPlay(track)}
      onClick={handleClick}
      onContextMenu={(event) => {
        event.preventDefault();
        setMenuPoint({ x: event.clientX, y: event.clientY });
      }}
    >
      <div className={styles.index}>
        <span className={styles.number} aria-hidden>
          {isCurrent ? <Equalizer playing={playingNow} /> : position}
        </span>
        <button
          type="button"
          className={styles.rowPlay}
          aria-label={playingNow ? `Wstrzymaj „${track.title}”` : `Odtwórz „${track.title}”`}
          onClick={() => onPlay(track)}
        >
          {playingNow ? (
            <Pause size={16} fill="currentColor" aria-hidden />
          ) : (
            <Play size={16} fill="currentColor" aria-hidden />
          )}
        </button>
      </div>

      <div className={styles.main}>
        {showCover ? <CoverImage src={track.coverUrl} alt="" size={96} className={styles.thumb} /> : null}
        <div className={styles.text}>
          <span className={styles.title}>
            {renderTitle ? renderTitle(track.title) : track.title}
            {isCurrent ? <span className="visually-hidden"> (teraz odtwarzane)</span> : null}
          </span>
          <span className={styles.artist}>
            {track.source !== 'generated' ? (
              <span className={styles.external} title="Źródło zewnętrzne: wymaga internetu">
                <Globe size={12} aria-hidden />
                <span className="visually-hidden">Źródło zewnętrzne. </span>
              </span>
            ) : null}
            {track.artistId ? (
              <Link to={`/artist/${track.artistId}`} className={styles.link}>
                {track.artistName}
              </Link>
            ) : (
              track.artistName
            )}
          </span>
        </div>
      </div>

      {showAlbum ? (
        <div className={styles.album}>
          {track.albumId && track.albumTitle ? (
            <Link to={`/album/${track.albumId}`} className={styles.link}>
              {track.albumTitle}
            </Link>
          ) : (
            (track.albumTitle ?? '')
          )}
        </div>
      ) : null}

      {addedAt !== undefined ? <div className={styles.added}>{formatRelativeDay(addedAt)}</div> : null}

      <div className={styles.like}>
        <LikeButton track={track} />
      </div>
      <div className={styles.duration}>{track.durationSec > 0 ? formatDuration(track.durationSec) : ''}</div>
      <div className={styles.more}>
        <MenuButton items={items} label={`Więcej opcji: ${track.title}`} tooltip="Więcej opcji" />
      </div>

      {menuPoint ? (
        <Menu items={items} anchor={menuPoint} label={`Opcje utworu ${track.title}`} onClose={closeMenu} />
      ) : null}
    </li>
  );
}

/** Wiersz listy utworów. memo: wiersz renderuje się ponownie tylko, gdy zmienią się jego dane. */
export const TrackRow = memo(TrackRowComponent);
