import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import type { Genre } from '../../types/music';
import styles from './GenreTile.module.css';

interface GenreTileProps {
  genre: Genre;
  coverUrl?: string | null;
}

/** Kolorowy kafelek gatunku z przechyloną okładką w rogu. */
export function GenreTile({ genre, coverUrl }: GenreTileProps) {
  return (
    <Link
      to={`/genre/${genre.id}`}
      className={styles.tile}
      style={{ '--tile': genre.color } as CSSProperties}
    >
      <span className={styles.name}>{genre.name}</span>
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          className={styles.art}
          width={120}
          height={120}
          loading="lazy"
          decoding="async"
        />
      ) : null}
    </Link>
  );
}
