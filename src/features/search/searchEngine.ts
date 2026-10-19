// Wyszukiwarka działająca na danych aplikacji. Czysta funkcja: łatwa do przetestowania.
// Porównujemy teksty po normalizacji (małe litery, bez polskich znaków), więc
// zapytanie „swiatlo” znajdzie utwór „Światło przez liście”.

import { ALBUMS, ARTISTS, FEATURED_PLAYLISTS, GENRES, getArtist, getGenre, TRACKS } from '../../data/catalog';
import type { Album, Artist, Genre, Track, UserPlaylist } from '../../types/music';
import { normalizeQuery, normalizeText } from '../../utils/normalizeText';

export type SearchKind = 'tracks' | 'artists' | 'albums' | 'playlists' | 'genres';

export interface PlaylistSummary {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  trackCount: number;
  isUser: boolean;
}

export type TopResult =
  | { kind: 'track'; item: Track }
  | { kind: 'artist'; item: Artist }
  | { kind: 'album'; item: Album }
  | { kind: 'playlist'; item: PlaylistSummary }
  | { kind: 'genre'; item: Genre };

export interface SearchResults {
  query: string;
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: PlaylistSummary[];
  genres: Genre[];
  top: TopResult | null;
  total: number;
}

/**
 * Ocena dopasowania jednego słowa zapytania do tekstu:
 * 100 = cały tekst, 80 = początek tekstu, 60 = początek słowa, 30 = fragment słowa, 0 = brak.
 */
function scoreToken(text: string, token: string): number {
  if (!token) return 0;
  if (text === token) return 100;
  if (text.startsWith(token)) return 80;
  if (text.split(/[\s\-–:,.()/]+/).some((word) => word.startsWith(token))) return 60;
  if (token.length >= 2 && text.includes(token)) return 30;
  return 0;
}

/** Ocena tekstu: każde słowo zapytania musi pasować (logika „i”), inaczej wynik to 0. */
export function scoreText(text: string, query: string): number {
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) return 0;
  if (normalizedText === normalizedQuery) return 120;
  const tokens = normalizedQuery.split(' ');
  let total = 0;
  for (const token of tokens) {
    const score = scoreToken(normalizedText, token);
    if (score === 0) return 0;
    total += score;
  }
  return total / tokens.length;
}

/** Najlepsza ocena spośród kilku pól z wagami (np. tytuł ważniejszy niż nazwa albumu). */
function bestScore(fields: Array<[string | null | undefined, number]>, query: string): number {
  let best = 0;
  for (const [text, weight] of fields) {
    if (!text) continue;
    best = Math.max(best, scoreText(text, query) * weight);
  }
  return best;
}

function rank<T>(
  items: readonly T[],
  score: (item: T) => number,
  tieBreaker?: (item: T) => number,
): Array<{ item: T; score: number }> {
  return items
    .map((item) => ({ item, score: score(item) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || (tieBreaker ? tieBreaker(b.item) - tieBreaker(a.item) : 0));
}

const genreNames = (ids: readonly string[]) => ids.map((id) => getGenre(id)?.name ?? '').join(' ');

export function searchCatalog(query: string, userPlaylists: readonly UserPlaylist[] = []): SearchResults {
  const empty: SearchResults = {
    query,
    tracks: [],
    artists: [],
    albums: [],
    playlists: [],
    genres: [],
    top: null,
    total: 0,
  };
  if (!normalizeQuery(query)) return empty;

  const tracks = rank(
    TRACKS,
    (track) =>
      bestScore(
        [
          [track.title, 1],
          [track.artistName, 0.8],
          [track.albumTitle, 0.6],
          [genreNames(track.genreIds), 0.5],
        ],
        query,
      ),
    (track) => track.popularity,
  );

  const artists = rank(ARTISTS, (artist) =>
    bestScore(
      [
        [artist.name, 1],
        [genreNames(artist.genreIds), 0.5],
      ],
      query,
    ),
  );

  const albums = rank(ALBUMS, (album) =>
    bestScore(
      [
        [album.title, 1],
        [getArtist(album.artistId)?.name, 0.7],
        [getGenre(album.genreId)?.name, 0.5],
      ],
      query,
    ),
  );

  const playlistSummaries: PlaylistSummary[] = [
    ...userPlaylists.map((playlist) => ({
      id: playlist.id,
      title: playlist.title,
      description: playlist.description,
      coverUrl: null,
      trackCount: playlist.items.length,
      isUser: true,
    })),
    ...FEATURED_PLAYLISTS.map((playlist) => ({
      id: playlist.id,
      title: playlist.title,
      description: playlist.description,
      coverUrl: playlist.coverUrl,
      trackCount: playlist.trackIds.length,
      isUser: false,
    })),
  ];
  const playlists = rank(playlistSummaries, (playlist) =>
    bestScore(
      [
        [playlist.title, 1],
        [playlist.description, 0.4],
      ],
      query,
    ),
  );

  const genres = rank(GENRES, (genre) =>
    bestScore(
      [
        [genre.name, 1],
        [genre.description, 0.3],
      ],
      query,
    ),
  );

  // Najlepszy wynik: najwyższa ocena; przy remisie wykonawca i album wygrywają z utworem.
  const candidates: Array<{ result: TopResult; score: number }> = [];
  if (artists[0])
    candidates.push({ result: { kind: 'artist', item: artists[0].item }, score: artists[0].score + 2 });
  if (albums[0])
    candidates.push({ result: { kind: 'album', item: albums[0].item }, score: albums[0].score + 1 });
  if (tracks[0]) candidates.push({ result: { kind: 'track', item: tracks[0].item }, score: tracks[0].score });
  if (playlists[0])
    candidates.push({ result: { kind: 'playlist', item: playlists[0].item }, score: playlists[0].score - 1 });
  if (genres[0])
    candidates.push({ result: { kind: 'genre', item: genres[0].item }, score: genres[0].score - 2 });
  candidates.sort((a, b) => b.score - a.score);

  return {
    query,
    tracks: tracks.map((entry) => entry.item),
    artists: artists.map((entry) => entry.item),
    albums: albums.map((entry) => entry.item),
    playlists: playlists.map((entry) => entry.item),
    genres: genres.map((entry) => entry.item),
    top: candidates[0]?.result ?? null,
    total: tracks.length + artists.length + albums.length + playlists.length + genres.length,
  };
}

/**
 * Zakresy [początek, koniec) fragmentów tekstu pasujących do słów zapytania.
 * Służą do podświetlania dopasowań w wynikach.
 */
export function getHighlightRanges(text: string, query: string): Array<[number, number]> {
  const normalized = normalizeText(text);
  const tokens = normalizeQuery(query)
    .split(' ')
    .filter((token) => token.length > 0);
  const ranges: Array<[number, number]> = [];
  for (const token of tokens) {
    let from = 0;
    while (from <= normalized.length - token.length) {
      const index = normalized.indexOf(token, from);
      if (index === -1) break;
      ranges.push([index, index + token.length]);
      from = index + token.length;
    }
  }
  // Scalanie nachodzących na siebie zakresów.
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([range[0], range[1]]);
  }
  return merged;
}
