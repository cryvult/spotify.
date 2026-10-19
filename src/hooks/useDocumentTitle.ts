import { useEffect } from 'react';

/** Ustawia tytuł karty przeglądarki, np. „Szukaj | SONORA”. */
export function useDocumentTitle(title: string | null): void {
  useEffect(() => {
    document.title = title ? `${title} | SONORA` : 'SONORA';
  }, [title]);
}
