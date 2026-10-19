import { afterEach, describe, expect, it, vi } from 'vitest';
import { mapOpenverseResult, OpenverseError, searchOpenverse } from './openverseService';

const SAMPLE = {
  id: 'abc-123',
  title: 'Rain Piano',
  creator: 'Ktoś',
  url: 'https://example.org/rain.mp3',
  duration: 95000,
  license: 'by',
  license_version: '4.0',
  license_url: 'https://creativecommons.org/licenses/by/4.0/',
  foreign_landing_url: 'https://example.org/rain',
  thumbnail: null,
};

describe('openverseService', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('zamienia wynik API na utwór z informacją o licencji', () => {
    const track = mapOpenverseResult(SAMPLE);
    expect(track).toMatchObject({
      id: 'openverse:abc-123',
      title: 'Rain Piano',
      artistName: 'Ktoś',
      durationSec: 95,
      source: 'openverse',
      license: { name: 'CC BY 4.0', author: 'Ktoś', sourceUrl: 'https://example.org/rain' },
    });
  });

  it('pomija wyniki bez adresu pliku lub oznaczone jako dla dorosłych', () => {
    expect(mapOpenverseResult({ ...SAMPLE, url: undefined })).toBeNull();
    expect(mapOpenverseResult({ ...SAMPLE, mature: true })).toBeNull();
    expect(mapOpenverseResult('śmieci')).toBeNull();
  });

  it('pobiera wyniki z API', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ result_count: 1, results: [SAMPLE] }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const result = await searchOpenverse('rain piano test');
    expect(result.tracks).toHaveLength(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('q=rain+piano+test');
  });

  it('zwraca czytelny błąd przy limicie zapytań i braku sieci', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 429 })));
    await expect(searchOpenverse('limit-test')).rejects.toMatchObject({ kind: 'rate-limit' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(searchOpenverse('offline-test')).rejects.toBeInstanceOf(OpenverseError);
  });
});
