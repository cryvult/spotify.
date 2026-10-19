import { createContext, useContext } from 'react';
import type { Settings } from '../features/settings/settingsModel';

export interface SettingsContextValue {
  settings: Settings;
  /** Motyw faktycznie użyty (po rozstrzygnięciu ustawienia „systemowy”). */
  resolvedTheme: 'dark' | 'light';
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings musi być użyte wewnątrz <SettingsProvider>.');
  return value;
}
