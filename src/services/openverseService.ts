// Opcjonalne wyszukiwanie w Openverse (https://openverse.org) - otwartym katalogu
// utworów na licencjach Creative Commons. API nie wymaga klucza, ale ma limity zapytań
// dla użytkowników anonimowych, dlatego wyszukiwarka wysyła zapytania z opóźnieniem
// (debounce) i zapamiętuje wyniki.

import type { Track } from '../types/music';
import { isFiniteNumber, isRecord, isString } from '../utils/validation';

const ENDPOINT = 'https://api.openverse.org/v1/audio/';

/** Usługę można wyłączyć zmienną środowiskową VITE_ENABLE_OPENVERSE=false. */
export const OPENVERSE_AVAILABLE = import.meta.env.VITE_ENABLE_OPENVERSE !== 'false';

export type OpenverseErrorKind = 'rate-limit' | 'network' | 'server';

export class OpenverseError extends Error {
  readonly kind: OpenverseErrorKind;

  constructor(kind: OpenverseErrorKind, message: string) {
    super(message);
    this.name = 'OpenverseError';
    this.kind = kind;
  }
}

export interface OpenverseSearchResult {
  tracks: Track[];
  total: number;
}

const cache = new Map<string, OpenverseSearchResult>();

function licenseName(code: string, version: string): string {
  if (code === 'cc0') return 'CC0 1.0';
  if (code === 'pdm') return 'Domena publiczna';
  return `CC ${code.toUpperCase()} ${version}`.trim();
}

/** Zamienia wynik z API na obiekt Track. Pomija wpisy bez wymaganych pól. */
export function mapOpenverseResult(raw: unknown): Track | null {
  if (!isRecord(raw) || !isString(raw.id) || !isString(raw.url) || raw.mature === true) return null;
  const title = isString(raw.title) && raw.title.trim() ? raw.title.trim() : 'Bez tytułu';
  const creator = isString(raw.creator) && raw.creator.trim() ? raw.creator.trim() : 'Nieznany autor';
  const audioSet = isRecord(raw.audio_set) && isString(raw.audio_set.title) ? raw.audio_set.title : null;
  return {
    id: `openverse:${raw.id}`,
    title,
    artistId: null,
    artistName: creator,
    albumId: null,
    albumTitle: audioSet,
    durationSec: isFiniteNumber(raw.duration) ? raw.duration / 1000 : 0,
    audioUrl: raw.url,
    coverUrl: isString(raw.thumbnail) ? raw.thumbnail : null,
    genreIds: [],
    source: 'openverse',
    license: {
      name: licenseName(
        isString(raw.license) ? raw.license : '',
        isString(raw.license_version) ? raw.license_version : '',
      ),
      url: isString(raw.license_url) ? raw.license_url : null,
      author: creator,
      sourceUrl: isString(raw.foreign_landing_url) ? raw.foreign_landing_url : null,
    },
    trackNumber: null,
    popularity: 0,
    releaseDate: null,
  };
}

export async function searchOpenverse(query: string, signal?: AbortSignal): Promise<OpenverseSearchResult> {
  const key = query.trim().toLowerCase();
  const cached = cache.get(key);
  if (cached) return cached;

  const url = new URL(ENDPOINT);
  url.searchParams.set('q', query.trim());
  url.searchParams.set('page_size', '20');

  let response: Response;
  try {
    response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new OpenverseError('network', 'Brak połączenia z Openverse. Sprawdź internet i spróbuj ponownie.');
  }
  if (response.status === 429) {
    throw new OpenverseError(
      'rate-limit',
      'Openverse ogranicza liczbę zapytań. Odczekaj minutę i spróbuj ponownie.',
    );
  }
  if (!response.ok) {
    throw new OpenverseError(
      'server',
      `Openverse zwrócił błąd (${response.status}). Spróbuj ponownie później.`,
    );
  }

  const data: unknown = await response.json();
  const results = isRecord(data) && Array.isArray(data.results) ? data.results : [];
  const tracks = results.map(mapOpenverseResult).filter((track): track is Track => track !== null);
  const total = isRecord(data) && isFiniteNumber(data.result_count) ? data.result_count : tracks.length;
  const result = { tracks, total };
  cache.set(key, result);
  return result;
}
