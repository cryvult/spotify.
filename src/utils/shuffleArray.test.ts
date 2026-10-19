import { describe, expect, it } from 'vitest';
import { normalizeQuery, normalizeText } from './normalizeText';
import { createSeededRandom, shuffleArray } from './shuffleArray';

describe('shuffleArray', () => {
  it('zachowuje wszystkie elementy i nie zmienia oryginału', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = shuffleArray(items, createSeededRandom(42));
    expect(shuffled).toHaveLength(items.length);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('daje tę samą kolejność dla tego samego ziarna', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    expect(shuffleArray(items, createSeededRandom(7))).toEqual(shuffleArray(items, createSeededRandom(7)));
  });

  it('obsługuje puste i jednoelementowe tablice', () => {
    expect(shuffleArray([])).toEqual([]);
    expect(shuffleArray(['x'])).toEqual(['x']);
  });
});

describe('normalizeText', () => {
  it('usuwa polskie znaki i zmienia litery na małe', () => {
    expect(normalizeText('Światło przez liście')).toBe('swiatlo przez liscie');
    expect(normalizeText('ŻÓŁĆ')).toBe('zolc');
  });

  it('zachowuje długość tekstu (potrzebne do podświetlania)', () => {
    const text = 'Przystanek na żądanie';
    expect(normalizeText(text)).toHaveLength(text.length);
  });

  it('porządkuje zapytanie', () => {
    expect(normalizeQuery('  Neon   nad  Wisłą ')).toBe('neon nad wisla');
  });
});
