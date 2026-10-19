// Proste rekomendacje oparte na gatunkach. Wykorzystywane przez autoodtwarzanie
// (gdy kolejka się skończy) oraz sekcję „Odkryj coś nowego”.

import { TRACKS } from '../../data/catalog';
import type { Track } from '../../types/music';
import { shuffleArray } from '../../utils/shuffleArray';

interface RecommendOptions {
  seedTrack: Track | null;
  excludeIds: ReadonlySet<string>;
  limit?: number;
  random?: () => number;
}

/** Utwory podobne do `seedTrack`: najpierw ten sam gatunek, potem ten sam wykonawca, potem popularność. */
export function recommendTracks({
  seedTrack,
  excludeIds,
  limit = 5,
  random = Math.random,
}: RecommendOptions): Track[] {
  const candidates = TRACKS.filter((track) => !excludeIds.has(track.id) && track.id !== seedTrack?.id);
  const pool = candidates.length > 0 ? candidates : TRACKS.filter((track) => track.id !== seedTrack?.id);
  const score = (track: Track) => {
    if (!seedTrack) return track.popularity / 100;
    const sharedGenres = track.genreIds.filter((genre) => seedTrack.genreIds.includes(genre)).length;
    const sameArtist = track.artistId !== null && track.artistId === seedTrack.artistId ? 1 : 0;
    // Odrobina losowości sprawia, że autoodtwarzanie nie gra zawsze tego samego.
    return sharedGenres * 3 + sameArtist + track.popularity / 100 + random() * 1.5;
  };
  return [...pool].sort((a, b) => score(b) - score(a)).slice(0, limit);
}

/** Utwory, których użytkownik jeszcze nie słuchał ani nie polubił (w losowej kolejności). */
export function pickUndiscovered(
  playedIds: ReadonlySet<string>,
  likedIds: ReadonlySet<string>,
  limit = 6,
  random: () => number = Math.random,
): Track[] {
  const fresh = TRACKS.filter((track) => !playedIds.has(track.id) && !likedIds.has(track.id));
  const pool = fresh.length >= limit ? fresh : TRACKS.filter((track) => !likedIds.has(track.id));
  return shuffleArray(pool.length > 0 ? pool : TRACKS, random).slice(0, limit);
}
