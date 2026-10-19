import { Heart } from 'lucide-react';
import styles from './LikedCover.module.css';

/** Okładka listy „Ulubione utwory”: gradient w kolorach SONORA z sercem. */
export function LikedCover({ iconSize = 22, className }: { iconSize?: number; className?: string }) {
  return (
    <span className={`${styles.cover} ${className ?? ''}`} aria-hidden>
      <Heart size={iconSize} fill="currentColor" />
    </span>
  );
}
