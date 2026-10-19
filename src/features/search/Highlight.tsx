import type { ReactNode } from 'react';
import { getHighlightRanges } from './searchEngine';
import styles from './Highlight.module.css';

/** Tekst z podświetlonymi fragmentami pasującymi do zapytania. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const ranges = getHighlightRanges(text, query);
  if (ranges.length === 0) return <>{text}</>;
  const parts: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([start, end], index) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={index} className={styles.mark}>
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}
