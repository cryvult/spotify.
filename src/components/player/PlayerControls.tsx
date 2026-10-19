import { Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from 'lucide-react';
import { usePlayerControls, usePlayerState } from '../../context/PlayerContext';
import { IconButton } from '../ui/IconButton';
import { PlayButton } from '../music/PlayButton';
import styles from './PlayerControls.module.css';

const REPEAT_LABELS = {
  off: 'Włącz powtarzanie kolejki',
  all: 'Włącz powtarzanie utworu',
  one: 'Wyłącz powtarzanie',
} as const;

/** Losowo, poprzedni, odtwórz/pauza, następny, powtarzanie. */
export function PlayerControls({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const { state, currentTrack, isPlaying, isBuffering } = usePlayerState();
  const controls = usePlayerControls();
  const disabled = !currentTrack;

  return (
    <div className={`${styles.controls} ${size === 'lg' ? styles.large : ''}`}>
      <IconButton
        icon={Shuffle}
        label={state.shuffle ? 'Wyłącz odtwarzanie losowe' : 'Włącz odtwarzanie losowe'}
        size={size === 'lg' ? 'md' : 'sm'}
        active={state.shuffle}
        onClick={controls.toggleShuffle}
        disabled={disabled}
      />
      <IconButton
        icon={SkipBack}
        label="Poprzedni"
        iconFill
        size={size}
        onClick={controls.previous}
        disabled={disabled}
      />
      <PlayButton
        playing={isPlaying}
        buffering={isBuffering}
        label={isPlaying ? 'Wstrzymaj' : 'Odtwórz'}
        size={size === 'lg' ? 'lg' : 'sm'}
        className={styles.play}
        onClick={controls.togglePlay}
        disabled={disabled}
      />
      <IconButton
        icon={SkipForward}
        label="Następny"
        iconFill
        size={size}
        onClick={controls.next}
        disabled={disabled}
      />
      <IconButton
        icon={state.repeat === 'one' ? Repeat1 : Repeat}
        label={REPEAT_LABELS[state.repeat]}
        tooltip={
          state.repeat === 'off'
            ? 'Powtarzaj'
            : state.repeat === 'all'
              ? 'Powtarzanie kolejki'
              : 'Powtarzanie utworu'
        }
        size={size === 'lg' ? 'md' : 'sm'}
        active={state.repeat !== 'off'}
        onClick={controls.cycleRepeat}
        disabled={disabled}
      />
    </div>
  );
}
