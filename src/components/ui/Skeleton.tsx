import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  radius?: 'sm' | 'md' | 'pill' | 'circle';
  className?: string;
}

/** Szary prostokąt z delikatnym połyskiem: zastępuje treść, która jeszcze się wczytuje. */
export function Skeleton({ width = '100%', height = '1rem', radius = 'sm', className }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={`${styles.skeleton} ${styles[radius]} ${className ?? ''}`}
      style={{ width, height }}
    />
  );
}

/** Szkielet strony w kształcie nagłówka i siatki kart (podczas wczytywania widoku). */
export function PageSkeleton() {
  return (
    <div className={styles.page} role="status" aria-label="Wczytywanie widoku">
      <Skeleton width="40%" height="2.25rem" radius="md" />
      <Skeleton width="25%" height="1rem" />
      <div className={styles.grid}>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className={styles.card}>
            <Skeleton height="auto" className={styles.cover} radius="md" />
            <Skeleton width="80%" />
            <Skeleton width="55%" height="0.75rem" />
          </div>
        ))}
      </div>
      <div className={styles.rows}>
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className={styles.row}>
            <Skeleton width="2.75rem" height="2.75rem" />
            <div className={styles.rowText}>
              <Skeleton width="45%" />
              <Skeleton width="30%" height="0.75rem" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Szkielet listy utworów (np. podczas wyszukiwania w zewnętrznym serwisie). */
export function TrackListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={styles.rows} role="status" aria-label="Wczytywanie wyników">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className={styles.row}>
          <Skeleton width="2.75rem" height="2.75rem" />
          <div className={styles.rowText}>
            <Skeleton width={`${40 + ((index * 17) % 30)}%`} />
            <Skeleton width={`${20 + ((index * 11) % 20)}%`} height="0.75rem" />
          </div>
        </div>
      ))}
    </div>
  );
}
