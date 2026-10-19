import { useCallback, useEffect, useState } from 'react';
import { OpenverseError, searchOpenverse } from '../../services/openverseService';
import type { Track } from '../../types/music';

export type OpenverseState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; tracks: Track[]; total: number }
  | { status: 'error'; message: string };

/**
 * Wyszukiwanie w Openverse. Zapytanie powinno być już opóźnione (debounce) przez wywołującego.
 * Poprzednie zapytanie jest anulowane (AbortController), gdy użytkownik wpisze nowe.
 */
export function useOpenverseSearch(query: string, enabled: boolean) {
  const [state, setState] = useState<OpenverseState>({ status: 'idle' });
  const [attempt, setAttempt] = useState(0);
  const trimmed = query.trim();
  const active = enabled && trimmed.length >= 2;

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    // Stan „wczytywanie” ustawiamy asynchronicznie, razem z rozpoczęciem zapytania.
    queueMicrotask(() => {
      if (!controller.signal.aborted) setState({ status: 'loading' });
    });
    searchOpenverse(trimmed, controller.signal)
      .then((result) => setState({ status: 'success', tracks: result.tracks, total: result.total }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          error instanceof OpenverseError
            ? error.message
            : 'Nie udało się pobrać wyników z Openverse. Spróbuj ponownie.';
        setState({ status: 'error', message });
      });
    return () => controller.abort();
  }, [active, trimmed, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { state: active ? state : ({ status: 'idle' } as const), retry };
}
