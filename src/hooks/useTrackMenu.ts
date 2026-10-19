import {
  Disc3,
  ExternalLink,
  Heart,
  Link,
  ListEnd,
  ListPlus,
  ListStart,
  MicVocal,
  Trash2,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import type { MenuItem } from '../components/ui/Menu';
import type { Track } from '../types/music';
import { useTrackActions } from './useTrackActions';

interface TrackMenuOptions {
  /** Gdy podane, menu zawiera polecenie „Usuń z tej playlisty”. */
  onRemoveFromPlaylist?: () => void;
}

/** Pozycje menu kontekstowego utworu. */
export function useTrackMenu(track: Track, options: TrackMenuOptions = {}): MenuItem[] {
  const actions = useTrackActions();
  const { isLiked } = useLibrary();
  const liked = isLiked(track.id);
  const items: MenuItem[] = [
    {
      id: 'next',
      label: 'Odtwórz jako następny',
      icon: ListStart,
      onSelect: () => actions.playNext([track]),
    },
    { id: 'queue', label: 'Dodaj do kolejki', icon: ListEnd, onSelect: () => actions.addToQueue([track]) },
    {
      id: 'playlist',
      label: 'Dodaj do playlisty…',
      icon: ListPlus,
      onSelect: () => actions.addToPlaylist([track]),
    },
    {
      id: 'like',
      label: liked ? 'Usuń z ulubionych' : 'Dodaj do ulubionych',
      icon: Heart,
      onSelect: () => actions.toggleLike(track),
    },
  ];
  if (options.onRemoveFromPlaylist) {
    items.push({
      id: 'remove',
      label: 'Usuń z tej playlisty',
      icon: Trash2,
      tone: 'danger',
      onSelect: options.onRemoveFromPlaylist,
    });
  }
  if (track.albumId) {
    items.push({
      id: 'album',
      label: 'Przejdź do albumu',
      icon: Disc3,
      separatorBefore: true,
      onSelect: () => actions.goToAlbum(track),
    });
  }
  if (track.artistId) {
    items.push({
      id: 'artist',
      label: 'Przejdź do wykonawcy',
      icon: MicVocal,
      separatorBefore: !track.albumId,
      onSelect: () => actions.goToArtist(track),
    });
  }
  if (track.albumId) {
    items.push({
      id: 'copy',
      label: 'Kopiuj link do albumu',
      icon: Link,
      onSelect: () => void actions.copyLink(`/album/${track.albumId}`, 'link do albumu'),
    });
  }
  const sourceUrl = track.license?.sourceUrl;
  if (sourceUrl) {
    items.push({
      id: 'source',
      label: 'Źródło i licencja',
      icon: ExternalLink,
      separatorBefore: true,
      onSelect: () => window.open(sourceUrl, '_blank', 'noopener,noreferrer'),
    });
  }
  return items;
}
