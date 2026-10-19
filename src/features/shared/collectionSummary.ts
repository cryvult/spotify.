import type { Track } from '../../types/music';
import { formatTotalDuration } from '../../utils/formatDuration';
import { formatCount, TRACK_FORMS } from '../../utils/pluralize';

/** Np. „8 utworów, 12 min 30 s”. */
export function collectionSummary(tracks: readonly Track[]): string {
  const total = tracks.reduce((sum, track) => sum + track.durationSec, 0);
  return tracks.length === 0
    ? formatCount(0, TRACK_FORMS)
    : `${formatCount(tracks.length, TRACK_FORMS)}, ${formatTotalDuration(total)}`;
}
