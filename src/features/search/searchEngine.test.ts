import { describe, expect, it } from 'vitest';
import type { UserPlaylist } from '../../types/music';
import { getHighlightRanges, scoreText, searchCatalog } from './searchEngine';

describe('scoreText', () => {
  it('ocenia dokładne dopasowanie wyżej niż fragment', () => {
    expect(scoreText('Pulsar', 'pulsar')).toBeGreaterThan(scoreText('Pulsar', 'puls'));
    expect(scoreText('Pulsar', 'puls')).toBeGreaterThan(scoreText('Pulsar', 'lsa'));
  });

  it('wymaga dopasowania wszystkich słów zapytania', () => {
    expect(scoreText('Neon nad Wisłą', 'neon wisla')).toBeGreaterThan(0);
    expect(scoreText('Neon nad Wisłą', 'neon kraków')).toBe(0);
  });

  it('zwraca 0 dla pustego zapytania', () => {
    expect(scoreText('Cokolwiek', '   ')).toBe(0);
  });
});

describe('searchCatalog', () => {
  it('znajduje utwór bez polskich znaków w zapytaniu', () => {
    const results = searchCatalog('swiatlo');
    expect(results.tracks.map((track) => track.title)).toContain('Światło przez liście');
  });

  it('znajduje wykonawcę, jego album i utwory', () => {
    const results = searchCatalog('kaskada');
    expect(results.artists[0]?.name).toBe('Kaskada');
    expect(results.tracks.length).toBeGreaterThanOrEqual(3);
    expect(results.top?.kind).toBe('artist');
  });

  it('wyszukuje gatunki i playlisty', () => {
    expect(searchCatalog('synthwave').genres[0]?.id).toBe('synthwave');
    expect(searchCatalog('nauka').playlists.map((playlist) => playlist.id)).toContain('nauka');
  });

  it('uwzględnia playlisty użytkownika', () => {
    const own: UserPlaylist = {
      id: 'pl_test',
      title: 'Moje wieczorne granie',
      description: '',
      items: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const results = searchCatalog('wieczorne', [own]);
    expect(results.playlists[0]).toMatchObject({ id: 'pl_test', isUser: true });
  });

  it('zwraca puste wyniki dla pustego zapytania i braku dopasowań', () => {
    expect(searchCatalog('').total).toBe(0);
    expect(searchCatalog('qqqzzzxxx').total).toBe(0);
    expect(searchCatalog('qqqzzzxxx').top).toBeNull();
  });
});

describe('getHighlightRanges', () => {
  it('wskazuje fragmenty pasujące do zapytania w oryginalnym tekście', () => {
    const text = 'Światło przez liście';
    const ranges = getHighlightRanges(text, 'swiatlo');
    expect(ranges).toEqual([[0, 7]]);
    expect(text.slice(0, 7)).toBe('Światło');
  });

  it('scala nachodzące na siebie zakresy', () => {
    expect(getHighlightRanges('abcabc', 'abc bca')).toEqual([[0, 6]]);
  });
});
