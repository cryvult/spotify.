/**
 * Polska odmiana liczebników: 1 utwór, 2 utwory, 5 utworów, 22 utwory, 25 utworów.
 * forms = [forma pojedyncza, forma dla 2-4, forma dla 5+]
 */
export function pluralize(count: number, forms: readonly [string, string, string]): string {
  const absolute = Math.abs(count);
  const lastDigit = absolute % 10;
  const lastTwoDigits = absolute % 100;
  if (absolute === 1) return forms[0];
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) return forms[1];
  return forms[2];
}

export function formatCount(count: number, forms: readonly [string, string, string]): string {
  return `${count} ${pluralize(count, forms)}`;
}

export const TRACK_FORMS = ['utwór', 'utwory', 'utworów'] as const;
export const PLAYLIST_FORMS = ['playlista', 'playlisty', 'playlist'] as const;
export const ALBUM_FORMS = ['album', 'albumy', 'albumów'] as const;
export const ARTIST_FORMS = ['wykonawca', 'wykonawców', 'wykonawców'] as const;
