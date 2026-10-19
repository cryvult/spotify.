import { Clock3 } from 'lucide-react';
import { useCallback, type ReactNode } from 'react';
import { usePlayerState } from '../../context/PlayerContext';
import type { Track } from '../../types/music';
import { TrackRow } from './TrackRow';
import rowStyles from './TrackRow.module.css';
import styles from './TrackList.module.css';

interface TrackListProps {
  tracks: Track[];
  /** Wywoływane z indeksem klikniętego utworu. */
  onPlayTrack: (index: number) => void;
  /** Czy ta lista jest aktualnie odtwarzana (wtedy klik na bieżący utwór pauzuje). */
  isActiveContext?: boolean;
  onTogglePlay?: () => void;
  showAlbum?: boolean;
  showCover?: boolean;
  showHeader?: boolean;
  /** Daty dodania w kolejności utworów (playlisty i ulubione). */
  addedAt?: string[];
  /** Numeracja z danych (np. numer utworu na albumie) zamiast kolejnej liczby. */
  numbering?: 'index' | 'trackNumber';
  onRemove?: (track: Track) => void;
  renderTitle?: (title: string) => ReactNode;
  label: string;
}

export function TrackList({
  tracks,
  onPlayTrack,
  isActiveContext = false,
  onTogglePlay,
  showAlbum = false,
  showCover = true,
  showHeader = true,
  addedAt,
  numbering = 'index',
  onRemove,
  renderTitle,
  label,
}: TrackListProps) {
  const { currentTrack, isPlaying } = usePlayerState();

  const handlePlay = useCallback(
    (track: Track) => {
      const index = tracks.findIndex((item) => item.id === track.id);
      // Kliknięcie w utwór, który właśnie gra z tej listy, działa jak pauza / wznowienie.
      if (isActiveContext && currentTrack?.id === track.id && onTogglePlay) onTogglePlay();
      else if (index !== -1) onPlayTrack(index);
    },
    [tracks, isActiveContext, currentTrack, onTogglePlay, onPlayTrack],
  );

  const headerClasses = [
    rowStyles.row,
    styles.header,
    showAlbum ? rowStyles.withAlbum : '',
    addedAt ? rowStyles.withAdded : '',
  ].join(' ');

  return (
    <div className={styles.list}>
      {showHeader ? (
        <div className={headerClasses} aria-hidden>
          <span className={styles.center}>#</span>
          <span>Tytuł</span>
          {showAlbum ? <span className={rowStyles.album}>Album</span> : null}
          {addedAt ? <span className={rowStyles.added}>Dodano</span> : null}
          <span />
          <span className={rowStyles.duration}>
            <Clock3 size={16} />
          </span>
          <span />
        </div>
      ) : null}
      <ol aria-label={label}>
        {tracks.map((track, index) => (
          <TrackRow
            key={`${track.id}-${index}`}
            track={track}
            position={numbering === 'trackNumber' ? (track.trackNumber ?? index + 1) : index + 1}
            isCurrent={currentTrack?.id === track.id}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            showAlbum={showAlbum}
            showCover={showCover}
            addedAt={addedAt?.[index]}
            onRemove={onRemove}
            renderTitle={renderTitle}
          />
        ))}
      </ol>
    </div>
  );
}
