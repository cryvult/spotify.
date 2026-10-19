import { usePlayerControls, usePlayerState } from '../../context/PlayerContext';
import type { Track } from '../../types/music';
import type { PlaybackContext } from '../../types/player';
import { CoverImage } from './CoverImage';
import { MediaCard } from './MediaCard';

interface TrackCardProps {
  track: Track;
  /** Lista, z której pochodzi karta: po tym utworze zagrają kolejne z listy. */
  tracks: Track[];
  index: number;
  context: PlaybackContext;
}

/** Karta pojedynczego utworu (np. „Ostatnio odtwarzane”). */
export function TrackCard({ track, tracks, index, context }: TrackCardProps) {
  const { currentTrack, isPlaying } = usePlayerState();
  const controls = usePlayerControls();
  const isCurrent = currentTrack?.id === track.id;
  return (
    <MediaCard
      to={track.albumId ? `/album/${track.albumId}` : '/recent'}
      title={track.title}
      subtitle={track.artistName}
      image={<CoverImage src={track.coverUrl} alt="" size={300} />}
      isPlaying={isCurrent && isPlaying}
      onPlay={() =>
        isCurrent ? controls.togglePlay() : controls.playTracks(tracks, { startIndex: index, context })
      }
      playLabel={isCurrent && isPlaying ? `Wstrzymaj „${track.title}”` : `Odtwórz „${track.title}”`}
    />
  );
}
