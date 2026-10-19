import { describe, expect, it } from 'vitest';
import { decodeSharedPlaylist, encodeSharedPlaylist } from './playlistShare';

describe('udostępnianie playlist', () => {
  it('koduje i dekoduje playlistę z polskimi znakami', () => {
    const { code, skipped } = encodeSharedPlaylist({
      title: 'Żółta łódź',
      description: 'Muzyka na wieczór',
      trackIds: ['parujacy-kubek', 'szklo'],
    });
    expect(skipped).toBe(0);
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeSharedPlaylist(code)).toEqual({
      title: 'Żółta łódź',
      description: 'Muzyka na wieczór',
      trackIds: ['parujacy-kubek', 'szklo'],
    });
  });

  it('pomija utwory spoza katalogu', () => {
    const { code, skipped } = encodeSharedPlaylist({
      title: 'Mix',
      description: '',
      trackIds: ['szklo', 'openverse:abc'],
    });
    expect(skipped).toBe(1);
    expect(decodeSharedPlaylist(code)?.trackIds).toEqual(['szklo']);
  });

  it('odrzuca uszkodzone i podrobione linki', () => {
    expect(decodeSharedPlaylist(null)).toBeNull();
    expect(decodeSharedPlaylist('%%%')).toBeNull();
    expect(decodeSharedPlaylist(btoa('{"t":""}'))).toBeNull();
    expect(decodeSharedPlaylist(btoa('[1,2,3]'))).toBeNull();
  });
});
