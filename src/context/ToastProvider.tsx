import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Toaster } from '../components/ui/Toaster';
import { ToastContext, type ToastContextValue, type ToastItem, type ToastOptions } from './ToastContext';

const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismissToast = useCallback((id: number) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((items) => items.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, tone = 'info', action, duration }: ToastOptions) => {
      const id = nextId.current++;
      setToasts((items) => [...items, { id, message, tone, action }].slice(-MAX_VISIBLE));
      const timeout = duration ?? (action ? 7000 : 4500);
      timers.current.set(
        id,
        window.setTimeout(() => dismissToast(id), timeout),
      );
      return id;
    },
    [dismissToast],
  );

  // Czyścimy liczniki czasu przy odmontowaniu.
  useEffect(() => {
    const active = timers.current;
    return () => active.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}
