import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { PlayButton } from '../../components/music/PlayButton';
import styles from './QuickAccess.module.css';

export interface QuickItem {
  key: string;
  to: string;
  title: string;
  image: ReactNode;
  isPlaying: boolean;
  onPlay: () => void;
}

/** Siatka kafelków szybkiego dostępu pod powitaniem (ulubione, ostatnie playlisty). */
export function QuickAccess({ items }: { items: QuickItem[] }) {
  return (
    <ul className={styles.grid} aria-label="Szybki dostęp">
      {items.map((item) => (
        <li key={item.key} className={styles.tile}>
          <span className={styles.image}>{item.image}</span>
          <Link to={item.to} className={styles.title}>
            {item.title}
          </Link>
          <PlayButton
            size="sm"
            playing={item.isPlaying}
            label={item.isPlaying ? `Wstrzymaj: ${item.title}` : `Odtwórz: ${item.title}`}
            className={`${styles.play} ${item.isPlaying ? styles.playVisible : ''}`}
            onClick={item.onPlay}
          />
        </li>
      ))}
    </ul>
  );
}
