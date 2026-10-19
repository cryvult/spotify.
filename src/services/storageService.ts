// Bezpieczny dostęp do localStorage. Interfejs nie korzysta z localStorage bezpośrednio,
// tylko przez ten moduł, dzięki czemu obsługa błędów jest w jednym miejscu.
//
// Przechowujemy wyłącznie dane nieosobowe: playlisty, ulubione, historię i ustawienia.
// Nie zapisujemy haseł ani danych poufnych.

const PREFIX = 'sonora:v1:';

export const STORAGE_KEYS = {
  settings: 'settings',
  library: 'library',
  player: 'player',
  playerPrefs: 'player-prefs',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** Funkcja sprawdzająca i porządkująca odczytane dane. Zwraca null, gdy danych nie da się użyć. */
export type Parser<T> = (raw: unknown) => T | null;

function getStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    // Np. zablokowane ciasteczka w trybie prywatnym.
    return null;
  }
}

/**
 * Odczytuje wartość. Zwraca `fallback`, gdy:
 * - wpisu nie ma,
 * - JSON jest uszkodzony,
 * - dane mają nieprawidłowy kształt (parser zwrócił null).
 */
export function readStorage<T>(key: StorageKey, parse: Parser<T>, fallback: T): T {
  const storage = getStorage();
  if (!storage) return fallback;
  let text: string | null;
  try {
    text = storage.getItem(PREFIX + key);
  } catch {
    return fallback;
  }
  if (text === null) return fallback;
  try {
    const parsed = parse(JSON.parse(text) as unknown);
    if (parsed === null) {
      console.warn(`[SONORA] Zapisane dane „${key}” mają nieprawidłowy format. Używam wartości domyślnych.`);
      return fallback;
    }
    return parsed;
  } catch {
    console.warn(
      `[SONORA] Nie udało się odczytać danych „${key}” (uszkodzony JSON). Używam wartości domyślnych.`,
    );
    return fallback;
  }
}

/** Zapisuje wartość. Zwraca false, gdy zapis się nie powiódł (np. brak miejsca). */
export function writeStorage(key: StorageKey, value: unknown): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key: StorageKey): void {
  try {
    getStorage()?.removeItem(PREFIX + key);
  } catch {
    // Brak dostępu do pamięci: nie ma czego usuwać.
  }
}

/** Usuwa wszystkie dane SONORA (i tylko je) z pamięci przeglądarki. */
export function clearAllStorage(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(PREFIX)) keys.push(key);
    }
    keys.forEach((key) => storage.removeItem(key));
  } catch {
    // Ignorujemy: brak dostępu do pamięci.
  }
}

export function isStorageAvailable(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    const probe = `${PREFIX}probe`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}
