import type { ReactNode } from 'react';
import { LibraryProvider } from '../context/LibraryProvider';
import { PlayerProvider } from '../context/PlayerProvider';
import { SettingsProvider } from '../context/SettingsProvider';
import { ToastProvider } from '../context/ToastProvider';
import { UIProvider } from '../context/UIProvider';
import type { AudioEngine } from '../services/audioEngine';

interface ProvidersProps {
  children: ReactNode;
  /** W testach można podstawić atrapę silnika audio. */
  createEngine?: () => AudioEngine;
}

/**
 * Kolejność ma znaczenie: odtwarzacz korzysta z ustawień, biblioteki i powiadomień,
 * więc musi być wewnątrz nich.
 */
export function Providers({ children, createEngine }: ProvidersProps) {
  return (
    <SettingsProvider>
      <ToastProvider>
        <LibraryProvider>
          <PlayerProvider createEngine={createEngine}>
            <UIProvider>{children}</UIProvider>
          </PlayerProvider>
        </LibraryProvider>
      </ToastProvider>
    </SettingsProvider>
  );
}
