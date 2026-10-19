import { describe, expect, it } from 'vitest';
import {
  ALBUMS,
  ARTISTS,
  FEATURED_PLAYLISTS,
  GENRES,
  getAlbumTracks,
  getArtist,
  getTrack,
  TRACKS,
} from './catalog';

describe('dane demonstracyjne', () => {
  it('zawierają co najmniej 20 utworów, kilku wykonawców i albumów', () => {
    expect(TRACKS.length).toBeGreaterThanOrEqual(20);
    expect(ARTISTS.length).toBeGreaterThanOrEqual(5);
    expect(ALBUMS.length).toBeGreaterThanOrEqual(5);
    expect(FEATURED_PLAYLISTS.length).toBeGreaterThanOrEqual(5);
  });

  it('mają unikalne identyfikatory', () => {
    for (const list of [TRACKS, ALBUMS, ARTISTS, FEATURED_PLAYLISTS, GENRES]) {
      const ids = list.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('mają poprawne powiązania utwór → album → wykonawca', () => {
    for (const track of TRACKS) {
      expect(getArtist(track.artistId ?? ''), `wykonawca utworu ${track.id}`).toBeDefined();
      const album = ALBUMS.find((item) => item.id === track.albumId);
      expect(album, `album utworu ${track.id}`).toBeDefined();
      expect(album?.artistId).toBe(track.artistId);
      expect(track.durationSec).toBeGreaterThan(0);
      expect(track.genreIds.length).toBeGreaterThan(0);
      track.genreIds.forEach((genre) => expect(GENRES.some((item) => item.id === genre)).toBe(true));
    }
  });

  it('każdy album ma utwory, a playlisty odwołują się do istniejących utworów', () => {
    ALBUMS.forEach((album) => expect(getAlbumTracks(album.id).length, album.id).toBeGreaterThan(0));
    FEATURED_PLAYLISTS.forEach((playlist) =>
      playlist.trackIds.forEach((id) => expect(getTrack(id), `${playlist.id}: ${id}`).toBeDefined()),
    );
  });

  it('każdy utwór ma informację o licencji', () => {
    TRACKS.forEach((track) => {
      expect(track.license?.name, track.id).toBeTruthy();
      if (track.source === 'remote')
        expect(track.license?.sourceUrl, track.id).toMatch(/^https:\/\/commons\.wikimedia\.org/);
    });
  });
});
