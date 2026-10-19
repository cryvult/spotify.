import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { UIContext, type UIContextValue } from './UIContext';

export function UIProvider({ children }: { children: ReactNode }) {
  const [isQueueOpen, setQueueOpen] = useState(false);
  const [isNowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [isNavOpen, setNavOpen] = useState(false);
  const toggleQueue = useCallback(() => setQueueOpen((open) => !open), []);

  const value = useMemo<UIContextValue>(
    () => ({
      isQueueOpen,
      setQueueOpen,
      toggleQueue,
      isNowPlayingOpen,
      setNowPlayingOpen,
      isNavOpen,
      setNavOpen,
    }),
    [isQueueOpen, toggleQueue, isNowPlayingOpen, isNavOpen],
  );
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}
