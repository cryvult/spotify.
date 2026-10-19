import { Plus } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { PlaylistCover } from '../../components/music/PlaylistCover';
import { useLibrary } from '../../context/LibraryContext';
import type { Track, UserPlaylist } from '../../types/music';
import { formatCount, TRACK_FORMS } from '../../utils/pluralize';
import styles from './Dialogs.module.css';

interface AddToPlaylistDialogProps {
  tracks: Track[] | null;
  onClose: () => void;
  onSelect: (playlist: UserPlaylist) => void;
  onCreateNew: () => void;
}

export function AddToPlaylistDialog({ tracks, onClose, onSelect, onCreateNew }: AddToPlaylistDialogProps) {
  const { playlists } = useLibrary();
  const open = tracks !== null;
  const subject =
    tracks && tracks.length === 1 ? `„${tracks[0]?.title}”` : formatCount(tracks?.length ?? 0, TRACK_FORMS);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Dodaj do playlisty"
      description={open ? `Wybierz playlistę dla: ${subject}.` : undefined}
    >
      <button type="button" className={styles.newPlaylist} onClick={onCreateNew}>
        <span className={styles.newIcon} aria-hidden>
          <Plus size={20} />
        </span>
        Nowa playlista
      </button>
      {playlists.length === 0 ? (
        <p className={styles.optionMeta}>
          Nie masz jeszcze własnych playlist. Utwórz pierwszą przyciskiem powyżej.
        </p>
      ) : (
        <ul className={styles.playlistList}>
          {playlists.map((playlist) => {
            const present = new Set(playlist.items.map((item) => item.trackId));
            const alreadyAll = (tracks ?? []).every((track) => present.has(track.id));
            return (
              <li key={playlist.id}>
                <button
                  type="button"
                  className={styles.playlistOption}
                  disabled={alreadyAll}
                  onClick={() => onSelect(playlist)}
                >
                  <PlaylistCover playlist={playlist} size={96} className={styles.optionCover} />
                  <span className={styles.optionText}>
                    <span className={styles.optionTitle}>{playlist.title}</span>
                    <span className={styles.optionMeta}>
                      {alreadyAll
                        ? 'Już zawiera wybrane utwory'
                        : formatCount(playlist.items.length, TRACK_FORMS)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
