import type { CSSProperties, ReactNode } from 'react';
import styles from './CollectionHeader.module.css';

interface CollectionHeaderProps {
  /** Rodzaj widoku, np. „Album”, „Playlista”, „Wykonawca”. */
  kind: string;
  title: string;
  description?: string;
  cover: ReactNode;
  meta?: ReactNode;
  accentColor?: string;
  coverShape?: 'square' | 'circle';
  /** Pasek akcji pod nagłówkiem (odtwarzanie, tryb losowy, menu). */
  actions?: ReactNode;
}

/** Nagłówek widoku albumu, playlisty lub wykonawcy z dużą okładką i kolorowym tłem. */
export function CollectionHeader({
  kind,
  title,
  description,
  cover,
  meta,
  accentColor = '#4b3a8f',
  coverShape = 'square',
  actions,
}: CollectionHeaderProps) {
  return (
    <div style={{ '--accent': accentColor } as CSSProperties}>
      <header className={styles.header}>
        <div className={`${styles.cover} ${coverShape === 'circle' ? styles.circle : ''}`}>{cover}</div>
        <div className={styles.info}>
          <span className={styles.kind}>{kind}</span>
          <h1 className={`${styles.title} ${title.length > 22 ? styles.long : ''}`}>{title}</h1>
          {description ? <p className={styles.description}>{description}</p> : null}
          {meta ? <div className={styles.meta}>{meta}</div> : null}
        </div>
      </header>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
