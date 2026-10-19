// Udostępnianie playlist linkiem. Dane playlisty (nazwa, opis, identyfikatory utworów)
// są zakodowane w samym linku, więc działa on na innym komputerze bez serwera.

import { getTrack } from '../../data/catalog';
import { isRecord, isString, isStringArray } from '../../utils/validation';
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from '../library/libraryReducer';

export interface SharedPlaylistData {
  title: string;
  description: string;
  trackIds: string[];
}

const MAX_SHARED_TRACKS = 200;

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(code: string): string {
  const base64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Koduje playlistę. Pomija utwory spoza katalogu (np. z Openverse), bo nie istnieją u odbiorcy. */
export function encodeSharedPlaylist(data: SharedPlaylistData): { code: string; skipped: number } {
  const catalogIds = data.trackIds.filter((id) => getTrack(id) !== undefined).slice(0, MAX_SHARED_TRACKS);
  const payload = {
    v: 1,
    t: data.title.slice(0, MAX_TITLE_LENGTH),
    d: data.description.slice(0, MAX_DESCRIPTION_LENGTH),
    i: catalogIds,
  };
  return { code: toBase64Url(JSON.stringify(payload)), skipped: data.trackIds.length - catalogIds.length };
}

/** Dekoduje link. Zwraca null dla uszkodzonych lub podrobionych danych. */
export function decodeSharedPlaylist(code: string | null): SharedPlaylistData | null {
  if (!code) return null;
  try {
    const raw: unknown = JSON.parse(fromBase64Url(code));
    if (!isRecord(raw) || !isString(raw.t) || !raw.t.trim() || !isStringArray(raw.i)) return null;
    return {
      title: raw.t.trim().slice(0, MAX_TITLE_LENGTH),
      description: isString(raw.d) ? raw.d.slice(0, MAX_DESCRIPTION_LENGTH) : '',
      trackIds: [...new Set(raw.i)].filter((id) => getTrack(id) !== undefined).slice(0, MAX_SHARED_TRACKS),
    };
  } catch {
    return null;
  }
}
