import type { Track } from '../../types/music';

export type LikedSort = 'added' | 'title' | 'artist';

interface LikedItem {
  track: Track;
  addedAt: string;
}

const collator = new Intl.Collator('pl', { sensitivity: 'base' });

/** Sortowanie ulubionych: od najnowszych, alfabetycznie po tytule albo po wykonawcy. */
export function sortLikedTracks<T extends LikedItem>(items: readonly T[], sort: LikedSort): T[] {
  const copy = [...items];
  if (sort === 'title') return copy.sort((a, b) => collator.compare(a.track.title, b.track.title));
  if (sort === 'artist') {
    return copy.sort(
      (a, b) =>
        collator.compare(a.track.artistName, b.track.artistName) ||
        collator.compare(a.track.title, b.track.title),
    );
  }
  return copy.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}
