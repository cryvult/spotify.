import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_SETTINGS, parseSettings, type Settings } from '../features/settings/settingsModel';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { readStorage, STORAGE_KEYS, writeStorage } from '../services/storageService';
import { SettingsContext, type SettingsContextValue } from './SettingsContext';

const THEME_COLORS = { dark: '#07060b', light: '#e4e2ec' } as const;

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() =>
    readStorage(STORAGE_KEYS.settings, parseSettings, DEFAULT_SETTINGS),
  );
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const resolvedTheme = settings.theme === 'system' ? (prefersDark ? 'dark' : 'light') : settings.theme;

  useEffect(() => {
    writeStorage(STORAGE_KEYS.settings, settings);
  }, [settings]);

  // Motyw i ograniczenie animacji ustawiamy jako atrybuty <html>, z których korzysta CSS.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolvedTheme]);
  }, [resolvedTheme]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.motion === 'reduce') root.dataset.reduceMotion = 'true';
    else delete root.dataset.reduceMotion;
  }, [settings.motion]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((previous) => ({ ...previous, ...patch }));
  }, []);

  const resetSettings = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, resolvedTheme, updateSettings, resetSettings }),
    [settings, resolvedTheme, updateSettings, resetSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
