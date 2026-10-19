// Katalog: łączy surowe dane w gotowe obiekty i udostępnia funkcje wyszukujące.
// Dane są statyczne, więc mapy budujemy raz, przy pierwszym imporcie modułu.

import type { Album, Artist, FeaturedPlaylist, Genre, GenreId, Track } from '../types/music';
import { ALBUMS } from './albums';
import { ARTISTS } from './artists';
import { GENRES } from './genres';
import { FEATURED_PLAYLISTS } from './playlists';
import { TRACK_SEEDS } from './tracks';

const artistMap = new Map(ARTISTS.map((artist) => [artist.id, artist]));
const albumMap = new Map(ALBUMS.map((album) => [album.id, album]));
const genreMap = new Map(GENRES.map((genre) => [genre.id, genre]));
const playlistMap = new Map(FEATURED_PLAYLISTS.map((playlist) => [playlist.id, playlist]));

export const TRACKS: Track[] = TRACK_SEEDS.map((seed) => {
  const album = albumMap.get(seed.albumId);
  const artist = artistMap.get(seed.artistId);
  return {
    id: seed.id,
    title: seed.title,
    artistId: seed.artistId,
    artistName: artist?.name ?? 'Nieznany wykonawca',
    albumId: seed.albumId,
    albumTitle: album?.title ?? null,
    durationSec: seed.durationSec,
    audioUrl: seed.audioUrl,
    coverUrl: album?.coverUrl ?? null,
    genreIds: seed.genreIds,
    source: seed.source,
    license: seed.license,
    trackNumber: seed.trackNumber,
    popularity: seed.popularity,
    releaseDate: album?.releaseDate ?? null,
  };
});

const trackMap = new Map(TRACKS.map((track) => [track.id, track]));

export { ALBUMS, ARTISTS, FEATURED_PLAYLISTS, GENRES };

export const getTrack = (id: string): Track | undefined => trackMap.get(id);
export const getAlbum = (id: string): Album | undefined => albumMap.get(id);
export const getArtist = (id: string): Artist | undefined => artistMap.get(id);
export const getGenre = (id: string): Genre | undefined => genreMap.get(id as GenreId);
export const getFeaturedPlaylist = (id: string): FeaturedPlaylist | undefined => playlistMap.get(id);

/** Zamienia listę identyfikatorów na utwory, pomijając nieistniejące. */
export function getTracksByIds(ids: readonly string[]): Track[] {
  return ids.map((id) => trackMap.get(id)).filter((track): track is Track => track !== undefined);
}

export function getAlbumTracks(albumId: string): Track[] {
  return TRACKS.filter((track) => track.albumId === albumId).sort(
    (a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0),
  );
}

export function getArtistTracks(artistId: string): Track[] {
  return TRACKS.filter((track) => track.artistId === artistId).sort((a, b) => b.popularity - a.popularity);
}

export function getArtistAlbums(artistId: string): Album[] {
  return sortByReleaseDate(ALBUMS.filter((album) => album.artistId === artistId));
}

export function getGenreTracks(genreId: GenreId): Track[] {
  return TRACKS.filter((track) => track.genreIds.includes(genreId)).sort(
    (a, b) => b.popularity - a.popularity,
  );
}

export function getGenreAlbums(genreId: GenreId): Album[] {
  return ALBUMS.filter((album) => album.genreId === genreId);
}

/** Okładka kafelka gatunku: pierwszy album gatunku albo okładka jego najpopularniejszego utworu. */
export function getGenreCover(genreId: GenreId): string | null {
  return getGenreAlbums(genreId)[0]?.coverUrl ?? getGenreTracks(genreId)[0]?.coverUrl ?? null;
}

export function getPlaylistsWithGenre(genreId: GenreId): FeaturedPlaylist[] {
  return FEATURED_PLAYLISTS.filter((playlist) =>
    getTracksByIds(playlist.trackIds).some((track) => track.genreIds.includes(genreId)),
  );
}

export function getPopularTracks(limit = 10): Track[] {
  return [...TRACKS].sort((a, b) => b.popularity - a.popularity).slice(0, limit);
}

export function getPopularArtists(): Artist[] {
  const score = (artist: Artist) =>
    getArtistTracks(artist.id).reduce((sum, track) => sum + track.popularity, 0) /
    Math.max(1, getArtistTracks(artist.id).length);
  return [...ARTISTS].sort((a, b) => score(b) - score(a));
}

/** Najnowsze wydania na początku; albumy bez znanej daty na końcu. */
export function sortByReleaseDate(albums: readonly Album[]): Album[] {
  return [...albums].sort((a, b) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''));
}

export function getNewReleases(): Album[] {
  return sortByReleaseDate(ALBUMS);
}

export function totalDuration(tracks: readonly Track[]): number {
  return tracks.reduce((sum, track) => sum + track.durationSec, 0);
}

export function getPlaylistsByCategory(category: FeaturedPlaylist['category']): FeaturedPlaylist[] {
  return FEATURED_PLAYLISTS.filter((playlist) => playlist.category === category);
}

const ALBUM_TYPE_LABELS: Record<Album['type'], string> = {
  album: 'Album',
  ep: 'EP',
  single: 'Singiel',
  compilation: 'Kompilacja',
};

export function albumTypeLabel(type: Album['type']): string {
  return ALBUM_TYPE_LABELS[type];
}
