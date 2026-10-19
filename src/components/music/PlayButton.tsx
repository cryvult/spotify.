import { LoaderCircle, Pause, Play } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import styles from './PlayButton.module.css';

interface PlayButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  playing: boolean;
  buffering?: boolean;
  /** Pełny opis, np. „Odtwórz album Szkło i mgła”. */
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

const ICON_SIZE = { sm: 16, md: 20, lg: 26 } as const;

/** Okrągły przycisk odtwarzania w kolorze akcentu. */
export function PlayButton({
  playing,
  buffering,
  label,
  size = 'md',
  className,
  type = 'button',
  ...rest
}: PlayButtonProps) {
  const Icon = buffering ? LoaderCircle : playing ? Pause : Play;
  return (
    <button
      type={type}
      aria-label={label}
      className={`${styles.button} ${styles[size]} ${className ?? ''}`}
      {...rest}
    >
      <Icon
        size={ICON_SIZE[size]}
        aria-hidden
        fill={buffering ? 'none' : 'currentColor'}
        className={buffering ? styles.spin : playing ? undefined : styles.playIcon}
      />
    </button>
  );
}
