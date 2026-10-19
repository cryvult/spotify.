import { getArtistTracks } from '../../data/catalog';
import { useCollectionPlayback } from '../../hooks/useCollectionPlayback';
import type { Artist } from '../../types/music';
import { CoverImage } from './CoverImage';
import { MediaCard } from './MediaCard';

export function ArtistCard({ artist }: { artist: Artist }) {
  const playback = useCollectionPlayback(
    { type: 'artist', id: artist.id, title: artist.name, path: `/artist/${artist.id}` },
    getArtistTracks(artist.id),
  );
  return (
    <MediaCard
      to={`/artist/${artist.id}`}
      title={artist.name}
      subtitle={artist.isFictional ? 'Wykonawca' : 'Wykonawca · Creative Commons'}
      shape="circle"
      image={<CoverImage src={artist.imageUrl} alt="" size={300} shape="circle" />}
      onPlay={playback.toggle}
      isPlaying={playback.isPlaying}
      playLabel={playback.isPlaying ? `Wstrzymaj: ${artist.name}` : `Odtwórz utwory: ${artist.name}`}
    />
  );
}
