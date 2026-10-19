import { Heart } from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import { useLibrary } from '../../context/LibraryContext';
import { useTrackActions } from '../../hooks/useTrackActions';
import type { Track } from '../../types/music';
import styles from './LikeButton.module.css';

interface LikeButtonProps {
  track: Track;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Serce „Lubię to”: stan pochodzi z biblioteki, więc jest spójny w całej aplikacji. */
export function LikeButton({ track, size = 'sm', className }: LikeButtonProps) {
  const { isLiked } = useLibrary();
  const { toggleLike } = useTrackActions();
  const liked = isLiked(track.id);
  return (
    <IconButton
      icon={Heart}
      size={size}
      iconFill={liked}
      label={liked ? `Usuń „${track.title}” z ulubionych` : `Dodaj „${track.title}” do ulubionych`}
      tooltip={liked ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
      aria-pressed={liked}
      className={`${styles.like} ${liked ? styles.liked : ''} ${className ?? ''}`}
      onClick={(event) => {
        event.stopPropagation();
        toggleLike(track);
      }}
    />
  );
}
