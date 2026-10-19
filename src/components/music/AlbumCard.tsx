import { albumTypeLabel, getAlbumTracks, getArtist } from '../../data/catalog';
import { useCollectionPlayback } from '../../hooks/useCollectionPlayback';
import type { Album } from '../../types/music';
import { formatYear } from '../../utils/formatDate';
import { CoverImage } from './CoverImage';
import { MediaCard } from './MediaCard';

export function AlbumCard({ album, showArtist = true }: { album: Album; showArtist?: boolean }) {
  const playback = useCollectionPlayback(
    { type: 'album', id: album.id, title: album.title, path: `/album/${album.id}` },
    getAlbumTracks(album.id),
  );
  const year = formatYear(album.releaseDate);
  const subtitle = showArtist
    ? [year, getArtist(album.artistId)?.name].filter(Boolean).join(' · ')
    : [year, albumTypeLabel(album.type)].filter(Boolean).join(' · ');
  return (
    <MediaCard
      to={`/album/${album.id}`}
      title={album.title}
      subtitle={subtitle}
      image={<CoverImage src={album.coverUrl} alt="" size={300} />}
      onPlay={playback.toggle}
      isPlaying={playback.isPlaying}
      playLabel={playback.isPlaying ? `Wstrzymaj album ${album.title}` : `Odtwórz album ${album.title}`}
    />
  );
}
