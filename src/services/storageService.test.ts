import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearAllStorage, readStorage, STORAGE_KEYS, writeStorage } from './storageService';
import { isRecord } from '../utils/validation';

const parseVolume = (raw: unknown) =>
  isRecord(raw) && typeof raw.volume === 'number' ? { volume: raw.volume } : null;

describe('storageService', () => {
  afterEach(() => vi.restoreAllMocks());

  it('zapisuje i odczytuje dane', () => {
    expect(writeStorage(STORAGE_KEYS.playerPrefs, { volume: 0.4 })).toBe(true);
    expect(readStorage(STORAGE_KEYS.playerPrefs, parseVolume, { volume: 1 })).toEqual({ volume: 0.4 });
  });

  it('zwraca wartość domyślną, gdy danych brak', () => {
    expect(readStorage(STORAGE_KEYS.playerPrefs, parseVolume, { volume: 1 })).toEqual({ volume: 1 });
  });

  it('zwraca wartość domyślną dla uszkodzonego JSON-a', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('sonora:v1:player-prefs', '{to nie jest json');
    expect(readStorage(STORAGE_KEYS.playerPrefs, parseVolume, { volume: 1 })).toEqual({ volume: 1 });
  });

  it('zwraca wartość domyślną dla danych w złym formacie', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('sonora:v1:player-prefs', JSON.stringify({ volume: 'głośno' }));
    expect(readStorage(STORAGE_KEYS.playerPrefs, parseVolume, { volume: 1 })).toEqual({ volume: 1 });
  });

  it('zgłasza nieudany zapis (np. brak miejsca) bez wyrzucania wyjątku', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Brak miejsca', 'QuotaExceededError');
    });
    expect(writeStorage(STORAGE_KEYS.library, { duzo: 'danych' })).toBe(false);
  });

  it('czyści wyłącznie dane SONORA', () => {
    localStorage.setItem('inna-aplikacja', 'zostaje');
    writeStorage(STORAGE_KEYS.settings, { theme: 'light' });
    writeStorage(STORAGE_KEYS.library, {});
    clearAllStorage();
    expect(localStorage.getItem('sonora:v1:settings')).toBeNull();
    expect(localStorage.getItem('sonora:v1:library')).toBeNull();
    expect(localStorage.getItem('inna-aplikacja')).toBe('zostaje');
  });
});
