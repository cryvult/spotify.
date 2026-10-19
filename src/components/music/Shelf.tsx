import { useId, type ReactNode } from 'react';
import { Link } from 'react-router';
import styles from './Shelf.module.css';

interface ShelfProps {
  title: string;
  description?: string;
  /** Link „Pokaż wszystko”. */
  to?: string;
  children: ReactNode;
  /** single-row: jeden rząd kart (na telefonie przewijany w poziomie); grid: pełna siatka. */
  layout?: 'single-row' | 'grid';
}

/** Sekcja z nagłówkiem i rzędem kart (np. „Nowe wydania”). */
export function Shelf({ title, description, to, children, layout = 'single-row' }: ShelfProps) {
  const headingId = useId();
  return (
    <section className={styles.shelf} aria-labelledby={headingId}>
      <div className={styles.header}>
        <div>
          <h2 id={headingId} className={styles.title}>
            {to ? (
              <Link to={to} className={styles.titleLink}>
                {title}
              </Link>
            ) : (
              title
            )}
          </h2>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
        {to ? (
          <Link to={to} className={styles.showAll}>
            Pokaż wszystko
            <span className="visually-hidden">: {title}</span>
          </Link>
        ) : null}
      </div>
      <div className={layout === 'grid' ? styles.grid : styles.row}>{children}</div>
    </section>
  );
}

/** Pełna siatka kart dla stron z listami (albumy, wykonawcy, playlisty). */
export function CardGrid({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}
