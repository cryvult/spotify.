import { createContext, useContext } from 'react';
import type { Track, UserPlaylist } from '../types/music';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
}

export interface DialogContextValue {
  /** Pokazuje okno potwierdzenia i zwraca true, gdy użytkownik potwierdzi. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Tworzenie playlisty; opcjonalnie od razu z utworami. */
  openCreatePlaylist: (tracks?: Track[]) => void;
  openEditPlaylist: (playlist: UserPlaylist) => void;
  openAddToPlaylist: (tracks: Track[]) => void;
  openShortcuts: () => void;
}

export const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialogs(): DialogContextValue {
  const value = useContext(DialogContext);
  if (!value) throw new Error('useDialogs musi być użyte wewnątrz <DialogProvider>.');
  return value;
}
