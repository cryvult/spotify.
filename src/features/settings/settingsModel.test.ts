import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseSettings } from './settingsModel';

describe('parseSettings', () => {
  it('uzupełnia brakujące pola wartościami domyślnymi', () => {
    expect(parseSettings({ theme: 'light' })).toEqual({ ...DEFAULT_SETTINGS, theme: 'light' });
  });

  it('odrzuca nieprawidłowe wartości pól', () => {
    const parsed = parseSettings({
      theme: 'różowy',
      autoplay: 'tak',
      favoriteGenres: ['lofi', 'polka', 'lofi'],
      userName: 5,
    });
    expect(parsed?.theme).toBe('dark');
    expect(parsed?.autoplay).toBe(true);
    expect(parsed?.favoriteGenres).toEqual(['lofi']);
    expect(parsed?.userName).toBe('');
  });

  it('zwraca null dla danych, które nie są obiektem', () => {
    expect(parseSettings(42)).toBeNull();
  });
});
