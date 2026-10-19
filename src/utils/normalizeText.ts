// Litery, których nie rozkłada normalizacja Unicode (NFD).
const SPECIAL_LETTERS: Record<string, string> = { ł: 'l', Ł: 'l', ø: 'o', Ø: 'o', đ: 'd', Đ: 'd' };

/**
 * Normalizuje pojedynczy znak: małe litery, bez polskich znaków diakrytycznych.
 * Każdy znak wejściowy daje dokładnie jeden znak wyjściowy, dzięki czemu
 * pozycje dopasowań w tekście znormalizowanym odpowiadają pozycjom w oryginale.
 */
function normalizeChar(char: string): string {
  const special = SPECIAL_LETTERS[char];
  if (special) return special;
  const base = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return (base[0] ?? char).toLowerCase();
}

/** Tekst przygotowany do porównań w wyszukiwarce („Światło” → „swiatlo”). */
export function normalizeText(text: string): string {
  return Array.from(text, normalizeChar).join('');
}

/** Normalizacja zapytania: dodatkowo przycina spacje i zamienia wielokrotne spacje na jedną. */
export function normalizeQuery(query: string): string {
  return normalizeText(query.trim().replace(/\s+/g, ' '));
}
