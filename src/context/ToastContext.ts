import { createContext, useContext } from 'react';

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastOptions {
  message: string;
  tone?: ToastTone;
  /** Opcjonalny przycisk w powiadomieniu, np. „Cofnij”. */
  action?: { label: string; onClick: () => void };
  /** Czas wyświetlania w ms. */
  duration?: number;
}

export interface ToastItem extends Required<Pick<ToastOptions, 'message' | 'tone'>> {
  id: number;
  action?: ToastOptions['action'];
}

export interface ToastContextValue {
  showToast: (options: ToastOptions) => number;
  dismissToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast musi być użyte wewnątrz <ToastProvider>.');
  return value;
}
