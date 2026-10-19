import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useDialogs } from '../context/DialogContext';
import { useLibrary } from '../context/LibraryContext';
import { usePlayerControls } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import type { Track } from '../types/music';
import { formatCount, TRACK_FORMS } from '../utils/pluralize';
import { appUrl, copyText } from '../utils/share';

/** Wspólne akcje na utworach z czytelnymi powiadomieniami (używane w listach, kartach i menu). */
export function useTrackActions() {
  const library = useLibrary();
  const controls = usePlayerControls();
  const dialogs = useDialogs();
  const { showToast } = useToast();
  const navigate = useNavigate();

  return useMemo(() => {
    const describe = (tracks: Track[]) =>
      tracks.length === 1 ? `„${tracks[0]?.title}”` : formatCount(tracks.length, TRACK_FORMS);

    return {
      toggleLike(track: Track) {
        const previous = library.liked.find((entry) => entry.trackId === track.id);
        const liked = library.toggleLike(track);
        showToast({
          tone: liked ? 'success' : 'info',
          message: liked ? 'Dodano do ulubionych.' : 'Usunięto z ulubionych.',
          action: {
            label: 'Cofnij',
            onClick: () => library.setLiked(track, !liked, previous?.addedAt),
          },
        });
      },
      addToQueue(tracks: Track[]) {
        if (tracks.length === 0) return;
        controls.addToQueue(tracks);
        showToast({ message: `Dodano do kolejki: ${describe(tracks)}.` });
      },
      playNext(tracks: Track[]) {
        if (tracks.length === 0) return;
        controls.playNext(tracks);
        showToast({ message: `Zagra jako następne: ${describe(tracks)}.` });
      },
      addToPlaylist(tracks: Track[]) {
        if (tracks.length > 0) dialogs.openAddToPlaylist(tracks);
      },
      goToAlbum(track: Track) {
        if (track.albumId) navigate(`/album/${track.albumId}`);
      },
      goToArtist(track: Track) {
        if (track.artistId) navigate(`/artist/${track.artistId}`);
      },
      async copyLink(path: string, what = 'link') {
        const copied = await copyText(appUrl(path));
        showToast(
          copied
            ? { tone: 'success', message: `Skopiowano ${what} do schowka.` }
            : {
                tone: 'error',
                message: 'Nie udało się skopiować. Przeglądarka zablokowała dostęp do schowka.',
              },
        );
      },
    };
  }, [library, controls, dialogs, showToast, navigate]);
}
