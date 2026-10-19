import type { GenreId } from '../../types/music';
import { isBoolean, isRecord, isString, oneOf } from '../../utils/validation';

export type ThemePreference = 'dark' | 'light' | 'system';
export type MotionPreference = 'system' | 'reduce';

export interface Settings {
  theme: ThemePreference;
  motion: MotionPreference;
  /** Po skończeniu kolejki odtwarzaj podobne utwory. */
  autoplay: boolean;
  /** Pamiętaj kolejkę i miejsce w utworze po odświeżeniu strony. */
  rememberQueue: boolean;
  /** Pozwól wyszukiwarce pytać zewnętrzny serwis Openverse. */
  openverseEnabled: boolean;
  /** Imię używane tylko w powitaniu na stronie głównej. */
  userName: string;
  favoriteGenres: GenreId[];
  onboardingDone: boolean;
  sidebarCollapsed: boolean;
}

export const GENRE_IDS: readonly GenreId[] = [
  'lofi',
  'synthwave',
  'ambient',
  'neoklasyka',
  'house',
  'chiptune',
  'downtempo',
  'folk',
];

export const MAX_NAME_LENGTH = 30;

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  motion: 'system',
  autoplay: true,
  rememberQueue: true,
  openverseEnabled: true,
  userName: '',
  favoriteGenres: [],
  onboardingDone: false,
  sidebarCollapsed: false,
};

/** Sprawdza zapisane ustawienia; brakujące lub błędne pola zastępuje wartościami domyślnymi. */
export function parseSettings(raw: unknown): Settings | null {
  if (!isRecord(raw)) return null;
  const pick = (key: keyof Settings) => raw[key];
  const bool = (key: keyof Settings, fallback: boolean) => {
    const value = pick(key);
    return isBoolean(value) ? value : fallback;
  };
  const genres = Array.isArray(raw.favoriteGenres)
    ? raw.favoriteGenres.filter((genre): genre is GenreId => GENRE_IDS.includes(genre as GenreId))
    : [];
  return {
    theme: oneOf(raw.theme, ['dark', 'light', 'system'] as const, DEFAULT_SETTINGS.theme),
    motion: oneOf(raw.motion, ['system', 'reduce'] as const, DEFAULT_SETTINGS.motion),
    autoplay: bool('autoplay', DEFAULT_SETTINGS.autoplay),
    rememberQueue: bool('rememberQueue', DEFAULT_SETTINGS.rememberQueue),
    openverseEnabled: bool('openverseEnabled', DEFAULT_SETTINGS.openverseEnabled),
    userName: isString(raw.userName) ? raw.userName.trim().slice(0, MAX_NAME_LENGTH) : '',
    favoriteGenres: [...new Set(genres)],
    onboardingDone: bool('onboardingDone', DEFAULT_SETTINGS.onboardingDone),
    sidebarCollapsed: bool('sidebarCollapsed', DEFAULT_SETTINGS.sidebarCollapsed),
  };
}
