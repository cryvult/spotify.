import { useLibrary } from '../../context/LibraryContext';
import { getTracksByIds } from '../../data/catalog';
import { useCollectionPlayback } from '../../hooks/useCollectionPlayback';
import type { FeaturedPlaylist, UserPlaylist } from '../../types/music';
import { formatCount, TRACK_FORMS } from '../../utils/pluralize';
import { CoverImage } from './CoverImage';
import { MediaCard } from './MediaCard';
import { PlaylistCover } from './PlaylistCover';

export function FeaturedPlaylistCard({ playlist }: { playlist: FeaturedPlaylist }) {
  const playback = useCollectionPlayback(
    { type: 'playlist', id: playlist.id, title: playlist.title, path: `/playlist/${playlist.id}` },
    getTracksByIds(playlist.trackIds),
  );
  return (
    <MediaCard
      to={`/playlist/${playlist.id}`}
      title={playlist.title}
      subtitle={playlist.description}
      image={<CoverImage src={playlist.coverUrl} alt="" size={300} />}
      onPlay={playback.toggle}
      isPlaying={playback.isPlaying}
      playLabel={
        playback.isPlaying ? `Wstrzymaj playlistę ${playlist.title}` : `Odtwórz playlistę ${playlist.title}`
      }
    />
  );
}

export function UserPlaylistCard({ playlist }: { playlist: UserPlaylist }) {
  const { resolveTracks } = useLibrary();
  const tracks = resolveTracks(playlist.items.map((item) => item.trackId));
  const playback = useCollectionPlayback(
    { type: 'playlist', id: playlist.id, title: playlist.title, path: `/playlist/${playlist.id}` },
    tracks,
  );
  return (
    <MediaCard
      to={`/playlist/${playlist.id}`}
      title={playlist.title}
      subtitle={`Twoja playlista · ${formatCount(playlist.items.length, TRACK_FORMS)}`}
      image={<PlaylistCover playlist={playlist} size={300} />}
      onPlay={tracks.length > 0 ? playback.toggle : undefined}
      isPlaying={playback.isPlaying}
      playLabel={
        playback.isPlaying ? `Wstrzymaj playlistę ${playlist.title}` : `Odtwórz playlistę ${playlist.title}`
      }
    />
  );
}
