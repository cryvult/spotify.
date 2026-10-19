import { createContext, useContext } from 'react';

export interface UIContextValue {
  isQueueOpen: boolean;
  setQueueOpen: (open: boolean) => void;
  toggleQueue: () => void;
  /** Pełnoekranowy odtwarzacz na telefonach. */
  isNowPlayingOpen: boolean;
  setNowPlayingOpen: (open: boolean) => void;
  /** Wysuwane menu nawigacji na mniejszych ekranach. */
  isNavOpen: boolean;
  setNavOpen: (open: boolean) => void;
}

export const UIContext = createContext<UIContextValue | null>(null);

export function useUI(): UIContextValue {
  const value = useContext(UIContext);
  if (!value) throw new Error('useUI musi być użyte wewnątrz <UIProvider>.');
  return value;
}
