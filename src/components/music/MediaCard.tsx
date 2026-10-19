import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { PlayButton } from './PlayButton';
import styles from './MediaCard.module.css';

interface MediaCardProps {
  to: string;
  title: string;
  subtitle?: ReactNode;
  image: ReactNode;
  shape?: 'square' | 'circle';
  onPlay?: () => void;
  isPlaying?: boolean;
  playLabel?: string;
}

/**
 * Karta albumu, playlisty lub wykonawcy. Cała karta jest klikalna (link „rozciągnięty”
 * na kartę), a przycisk odtwarzania leży nad linkiem jako osobny element.
 */
export function MediaCard({
  to,
  title,
  subtitle,
  image,
  shape = 'square',
  onPlay,
  isPlaying = false,
  playLabel,
}: MediaCardProps) {
  return (
    <article className={`${styles.card} ${shape === 'circle' ? styles.circle : ''}`}>
      <div className={styles.imageWrap}>
        {image}
        {onPlay ? (
          <PlayButton
            playing={isPlaying}
            label={playLabel ?? (isPlaying ? `Wstrzymaj: ${title}` : `Odtwórz: ${title}`)}
            className={`${styles.play} ${isPlaying ? styles.playVisible : ''}`}
            onClick={onPlay}
          />
        ) : null}
      </div>
      <h3 className={styles.title}>
        <Link to={to} className={styles.link}>
          {title}
        </Link>
      </h3>
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
    </article>
  );
}
